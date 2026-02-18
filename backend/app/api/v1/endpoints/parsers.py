import asyncio
import json
import re
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Body, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID
from redis.asyncio import Redis
import Levenshtein
from datetime import datetime

from app.api import deps
from app.core.config import settings
from app.crud.crud_parser import (
    parser_job as crud_jobs, 
    parser_conflict as crud_conflicts,
    parser_settings as crud_settings,
    parser_job_log as crud_parser_logs
)
from app.crud.crud_anime import anime as crud_anime
from app.models.parser import ParserConflict, ParserJobLog
from app.schemas.parser import (
    ParserJob, 
    ResolveConflictRequest,
    SearchQuery,
    FetchFullQuery,
    ParserJobLog as ParserJobLogSchema,
    ParserJobCreate,
    ParserSettings,
    ParserSettingsUpdate
)
from app.tasks.parsers import run_full_sync_task, run_incremental_sync_task, run_release_updates_task
from app.services.parsers.shikimori import ShikimoriParserService
from app.services.parsers.kodik import KodikParserService

router = APIRouter()

# --- Helper Logic for Reconciliation ---

def merge_search_results(kodik: List[Dict], shiki: List[Dict]) -> List[Dict]:
    """Reconciles Shikimori metadata with Kodik CDN nodes."""
    merged = []
    shiki_map = {str(item['id']): item for item in shiki}
    processed_shiki_ids = set()

    for k_item in kodik:
        match = None
        # Strategy 1: Title exact match
        for s_id, s_item in shiki_map.items():
            if s_item['name'].lower() == k_item.get('title_orig', '').lower():
                match = s_item
                processed_shiki_ids.add(s_id)
                break
        
        merged.append({
            "id": f"k-{k_item['id']}",
            "kodik_id": k_item['id'],
            "shikimori_id": match['id'] if match else None,
            "title": k_item['title'],
            "title_original": k_item.get('title_orig', ''),
            "poster_url": f"https://shikimori.one{match['image']['original']}" if match and 'image' in match else None,
            "type": match['kind'] if match else k_item.get('type', 'anime'),
            "score": float(match['score']) if match and match.get('score') else 0,
            "year": k_item.get('year', 0),
            "sources": {"kodik": True, "shikimori": match is not None}
        })

    # Add remaining Shiki items
    for s_id, s_item in shiki_map.items():
        if s_id not in processed_shiki_ids:
            merged.append({
                "id": f"s-{s_id}",
                "kodik_id": None,
                "shikimori_id": s_id,
                "title": s_item['russian'],
                "title_original": s_item['name'],
                "poster_url": f"https://shikimori.one{s_item['image']['original']}" if 'image' in s_item else None,
                "type": s_item['kind'],
                "score": float(s_item.get('score', 0)),
                "year": int(s_item['aired_on'][:4]) if s_item.get('aired_on') else 0,
                "sources": {"kodik": False, "shikimori": True}
            })
    
    return sorted(merged, key=lambda x: x['score'], reverse=True)

def merge_full_data(shiki: Optional[Dict], kodik: Optional[Dict]) -> Dict:
    """Combines granular provider data into a single Anime construction schema."""
    data = {}
    if shiki:
        data.update({
            "title": shiki.get('russian'),
            "title_en": shiki.get('name'),
            "slug": re.sub(r'[^\w\s-]', '', shiki.get('name', '').lower()).strip().replace(' ', '-'),
            "description": shiki.get('description'),
            "kind": shiki.get('kind'),
            "status": shiki.get('status'),
            "score": float(shiki.get('score', 0)),
            "shikimori_id": shiki.get('id'),
            "poster_url": f"https://shikimori.one{shiki['image']['original']}" if 'image' in shiki else None,
            "episodes_total": shiki.get('episodes'),
            "year": int(shiki['aired_on'][:4]) if shiki.get('aired_on') else None,
            "genres": [g['russian'] for g in shiki.get('genres', [])]
        })
    if kodik:
        data["kodik_id"] = kodik.get('id')
        if not data.get("title"): data["title"] = kodik.get('title')
        
    return data

# --- Endpoints ---

@router.get("/jobs", response_model=List[ParserJob])
async def read_parser_jobs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    u = Depends(deps.get_current_active_superuser)
) -> Any:
    return await crud_jobs.get_multi(db, skip=skip, limit=limit)

@router.get("/jobs/{id}", response_model=ParserJob)
async def read_parser_job(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.get_current_active_superuser)
) -> Any:
    job = await crud_jobs.get(db, id=id)
    if not job: raise HTTPException(status_code=404)
    return job

@router.get("/jobs/{id}/logs", response_model=List[ParserJobLogSchema])
async def read_job_logs(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.get_current_active_superuser)
) -> Any:
    return await crud_parser_logs.get_multi_by_job(db, job_id=id)

@router.get("/logs", response_model=List[ParserJobLogSchema])
async def read_global_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    u = Depends(deps.get_current_active_superuser)
) -> Any:
    return await crud_parser_logs.get_multi(db, skip=skip, limit=limit)

@router.get("/conflicts", response_model=List[Any])
async def list_conflicts(
    db: AsyncSession = Depends(deps.get_db),
    status: str = "pending",
    u = Depends(deps.get_current_active_superuser)
) -> Any:
    return await crud_conflicts.get_multi(db, status=status)

@router.post("/conflicts/{id}/resolve")
async def resolve_conflict(
    id: UUID,
    req: ResolveConflictRequest,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.audit_trail("resolve_conflict", "parser"))
) -> Any:
    conflict = await crud_conflicts.get(db, id=id)
    if not conflict or conflict.status != "pending":
        raise HTTPException(status_code=404, detail="Active conflict node not found")
    
    if req.strategy == "replace":
        anime = await crud_anime.get(db, id=conflict.item_id)
        if anime:
            await crud_anime.update(db, db_obj=anime, obj_in=conflict.incoming_data)
    
    await crud_conflicts.update(db, db_obj=conflict, obj_in={
        "status": "resolved",
        "resolution_strategy": req.strategy,
        "resolved_at": datetime.utcnow(),
        "resolved_by": u.id
    })
    return {"status": "reconciled"}

@router.get("/settings", response_model=List[ParserSettings])
async def list_parser_settings(db: AsyncSession = Depends(deps.get_db), u = Depends(deps.get_current_active_superuser)):
    return await crud_settings.get_multi(db)

@router.patch("/settings/{category}", response_model=ParserSettings)
async def update_parser_settings(category: str, obj_in: ParserSettingsUpdate, db: AsyncSession = Depends(deps.get_db), u = Depends(deps.get_current_active_superuser)):
    db_obj = await crud_settings.get_by_category(db, category)
    if not db_obj:
        return await crud_settings.create(db, obj_in={"category": category, **obj_in.model_dump(), "updated_by": u.id})
    return await crud_settings.update(db, db_obj=db_obj, obj_in={**obj_in.model_dump(), "updated_by": u.id})

@router.post("/search-live")
async def search_live_orchestrator(query: SearchQuery, u = Depends(deps.get_current_active_superuser)):
    shiki = ShikimoriParserService()
    kodik = KodikParserService()
    try:
        s_task = shiki.client.get('/api/animes', params={'search': query.query, 'limit': 15})
        k_task = kodik.client.get('/search', params={'token': kodik.api_key, 'title': query.query, 'types': 'anime-serial,anime'})
        s_res, k_res = await asyncio.gather(s_task, k_task)
        merged_data = merge_search_results(k_res.json().get('results', []), s_res.json())
        return {"data": merged_data}
    finally:
        await asyncio.gather(shiki.close(), kodik.close())

@router.post("/fetch-full")
async def fetch_full_node(query: FetchFullQuery, u = Depends(deps.get_current_active_superuser)):
    shiki = ShikimoriParserService()
    kodik = KodikParserService()
    try:
        s_data = None
        if query.shikimori_id:
            s_data = await shiki.get_full_data(query.shikimori_id)
        
        k_data = None
        if query.kodik_id:
            k_data = await kodik._probe_cdn_node(query.kodik_id)
            
        merged = merge_full_data(s_data, k_data)
        return {"data": merged}
    finally:
        await asyncio.gather(shiki.close(), kodik.close())

@router.post("/jobs/trigger")
async def trigger_manual_job(job_in: ParserJobCreate, db: AsyncSession = Depends(deps.get_db), u = Depends(deps.get_current_active_superuser)):
    job = await crud_jobs.create(db, obj_in=job_in)
    if job_in.parser_name == "shikimori":
        if job_in.job_type == "full_sync": run_full_sync_task.delay(str(job.id))
        else: run_incremental_sync_task.delay(str(job.id))
    elif job_in.parser_name == "kodik":
        run_release_updates_task.delay(str(job.id))
    return {"job_id": job.id, "status": "dispatched"}

@router.websocket("/ws/jobs/{job_id}")
async def job_telemetry_ws(websocket: WebSocket, job_id: str, token: str = None):
    # Auth check: token passed as query param ?token=...
    from app.core import security
    from app.crud.crud_user import user as crud_user
    from app.db.session import AsyncSessionLocal
    from jose import JWTError
    from app.schemas.token import TokenPayload
    if not token:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    try:
        payload = security.jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.type != "access":
            await websocket.close(code=4001, reason="Invalid token type")
            return
    except (JWTError, Exception):
        await websocket.close(code=4001, reason="Invalid token")
        return
    await websocket.accept()
    redis = Redis.from_url(str(settings.REDIS_URL))
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"job_progress:{job_id}")
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_status=True, timeout=1.0)
            if message and message['type'] == 'message':
                await websocket.send_text(message['data'].decode('utf-8'))
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        await pubsub.unsubscribe(f"job_progress:{job_id}")
    finally:
        await redis.close()
