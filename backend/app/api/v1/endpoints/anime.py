
from typing import Any, List, Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from uuid import UUID

from app.api import deps
from app.crud.crud_anime import anime as crud_anime
from app.crud.crud_episode import episode as crud_episode
from app.schemas.anime import Anime, AnimeCreate, AnimeUpdate
from app.schemas.episode import Episode
from app.schemas.common import DataResponse, PaginatedResponse, ResponseMeta
from app.core.cache import cache
from app.models.anime import Anime as AnimeModel

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[Anime])
async def read_anime_list(
    db: AsyncSession = Depends(deps.get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    kind: Optional[str] = None,
    status: Optional[str] = None,
    genre: Optional[str] = None,
    year: Optional[int] = None,
    min_score: Optional[float] = None,
    q: Optional[str] = None,
) -> Any:
    # Check Cache
    cache_key = f"catalog:{page}:{limit}:{kind}:{status}:{genre}:{year}:{min_score}:{q}"
    cached_data = await cache.get(cache_key)
    if cached_data:
        return cached_data

    skip = (page - 1) * limit
    items, total = await crud_anime.get_multi_paginated(
        db, 
        skip=skip, 
        limit=limit,
        kind=kind,
        status=status,
        genre=genre,
        year=year,
        min_score=min_score,
        search=q
    )
    
    result = {
        "data": items,
        "meta": ResponseMeta(
            page=page,
            per_page=limit,
            total=total,
            total_pages=math.ceil(total / limit) if total > 0 else 0
        )
    }

    # Store in Cache (5 minutes)
    await cache.set(cache_key, result, expire=300)
    return result

@router.get("/genres", response_model=List[str])
async def get_unique_genres(
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Retrieve all unique genres currently present in the cluster registry."""
    query = select(func.jsonb_array_elements_text(AnimeModel.genres).label("genre")).distinct()
    result = await db.execute(query)
    return [row[0] for row in result.all()]

@router.get("/{slug}", response_model=DataResponse[Anime])
async def read_anime(
    slug: str,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    anime = await crud_anime.get_by_slug(db, slug=slug)
    if not anime:
        try:
            uuid_obj = UUID(slug)
            anime = await crud_anime.get(db, id=uuid_obj)
        except ValueError:
            pass
            
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return {"data": anime}

@router.get("/{id}/episodes", response_model=List[Episode])
async def read_anime_episodes(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    anime = await crud_anime.get(db, id=id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return await crud_episode.get_multi_by_anime(db, anime_id=id, skip=skip, limit=limit)

@router.post("/", response_model=DataResponse[Anime], status_code=201)
async def create_anime(
    *,
    db: AsyncSession = Depends(deps.get_db),
    anime_in: AnimeCreate,
    current_user = Depends(deps.audit_trail("create", "anime")),
) -> Any:
    existing = await crud_anime.get_by_slug(db, slug=anime_in.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Anime with this slug already exists")
    
    anime = await crud_anime.create(db, obj_in=anime_in)
    await cache.clear_prefix("catalog")
    
    return {"data": anime}

@router.patch("/{id}", response_model=DataResponse[Anime])
async def update_anime(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
    anime_in: AnimeUpdate,
    current_user = Depends(deps.audit_trail("update", "anime")),
) -> Any:
    anime = await crud_anime.get(db, id=id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    
    anime = await crud_anime.update(db, db_obj=anime, obj_in=anime_in)
    await cache.clear_prefix("catalog")
    
    return {"data": anime}

@router.delete("/{id}", status_code=204)
async def delete_anime(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.audit_trail("delete", "anime")),
):
    anime = await crud_anime.get(db, id=id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    
    await crud_anime.delete(db, id=id)
    await cache.clear_prefix("catalog")
