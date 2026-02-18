import httpx
import asyncio
import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.crud.crud_anime import anime as crud_anime
from app.crud.crud_parser import (
    parser_job as crud_jobs, 
    parser_conflict as crud_conflicts,
    parser_settings as crud_settings,
    parser_job_log as crud_parser_logs
)
from app.schemas.parser import ParserConflictCreate, ParserJobLogCreate
from app.services.media_service import media_service
from app.services.parsers.reconciliation import taxonomy_service
from app.core.celery_app import publish_job_progress
from app.core.logging import logger

class ShikimoriParserService:
    def __init__(self, proxy_config: Optional[Dict[str, Any]] = None):
        self.base_url = settings.SHIKIMORI_URL
        transport = None
        if proxy_config and proxy_config.get('proxy_enabled'):
            proxy_url = proxy_config.get('proxy_address')
            if proxy_url: transport = httpx.AsyncHTTPTransport(proxy=proxy_url)
        
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            transport=transport,
            headers={'User-Agent': proxy_config.get('user_agent', 'KitsuEngine/2.0')},
            timeout=30.0
        )

    async def close(self):
        await self.client.aclose()

    async def _add_log(self, db: AsyncSession, job_id: str, level: str, message: str, details: Optional[Dict] = None):
        """Audit logging for the Dashboard Console."""
        await crud_parser_logs.create(db, obj_in=ParserJobLogCreate(
            parser_job_id=job_id,
            level=level,
            message=message,
            details=details
        ))

    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
        reraise=True
    )
    async def get_full_data(self, external_id: str) -> Dict[str, Any]:
        """Fetch detailed data for a specific item with retry logic."""
        response = await self.client.get(f'/api/animes/{external_id}')
        # Only retry on 5xx or 429. Don't retry on 404.
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
        reraise=True
    )
    async def _fetch_page(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch a page of results with retry logic."""
        res = await self.client.get('/api/animes', params=params)
        res.raise_for_status()
        return res.json()

    def _apply_templates(self, data: Dict, config: Dict) -> Dict:
        """
        DLE Template Engine.
        Supports: {title}, {title_en}, {year}, {score}, {genres}, {status}, {studios}, {description}, {rating}
        """
        title_ru = data.get('russian') or data.get('name')
        title_en = data.get('name')
        year = str(data.get('aired_on', '')[:4] or "N/A")
        
        tpl_map = {
            '{title}': title_ru or '',
            '{title_en}': title_en or '',
            '{year}': year,
            '{score}': str(data.get('score', 0)),
            '{status}': data.get('status', 'unknown'),
            '{rating}': data.get('rating', 'none').upper(),
            '{genres}': ", ".join([g['russian'] for g in data.get('genres', [])]),
            '{studios}': ", ".join([s['name'] for s in data.get('studios', [])]),
            '{description}': data.get('description') or ''
        }

        def tpl(key: str, default: str) -> str:
            t = config.get(key)
            if not t: return default
            res = t
            for p, val in tpl_map.items():
                res = res.replace(p, str(val))
            return res

        clean_slug = re.sub(r'[^\w\s-]', '', title_en.lower()).strip().replace(' ', '-')

        return {
            "shikimori_id": data['id'],
            "title": tpl('tpl_title', title_ru),
            "title_en": title_en,
            "slug": clean_slug,
            "description": tpl('tpl_description', data.get('description') or ''),
            "score": float(data.get('score', 0)),
            "status": data.get('status'),
            "kind": data.get('kind'),
            "rating": data.get('rating'),
            "episodes_total": data.get('episodes') or 0,
            "poster_url": f"https://shikimori.one{data['image']['original']}" if 'image' in data else None,
            "genres": [g['russian'] for g in data.get('genres', [])],
            "studios": [s['name'] for s in data.get('studios', [])],
            "aired_on": data.get('aired_on')
        }

    async def _passes_filters(self, db: AsyncSession, job_id: str, details: Dict, config: Dict, blacklist: Dict) -> bool:
        """Grabbing Tab Logic: Policy enforcement."""
        score = float(details.get('score', 0))
        if score < config.get('min_score', 0):
            await self._add_log(db, job_id, "DEBUG", f"Filter: Score {score} is below threshold.")
            return False
        
        banned_ids_str = blacklist.get('banned_ids', '')
        if banned_ids_str:
            banned_ids = [int(i.strip()) for i in banned_ids_str.split(',') if i.strip().isdigit()]
            if details['id'] in banned_ids:
                await self._add_log(db, job_id, "WARNING", f"Blacklist: Blocked ID {details['id']}.")
                return False

        if not config.get('if_lgbt', True):
            forbidden = ['yaoi', 'yuri', 'shounen ai', 'shoujo ai', 'boys love', 'girls love', 'hentai']
            genres = [g['name'].lower() for g in details.get('genres', [])]
            if any(x in genres for x in forbidden):
                await self._add_log(db, job_id, "DEBUG", f"Filter: LGBT/Hentai content blocked for {details['name']}.")
                return False
        
        if not config.get('if_camrip', False):
            markers = ['camrip', 'ts', 'vcd', 'hdcam', 'screener']
            text = (details.get('name', '') + (details.get('russian', '') or '')).lower()
            if any(m in text for m in markers):
                await self._add_log(db, job_id, "DEBUG", f"Filter: Low quality CAMRip marker found.")
                return False
            
        return True

    async def _detect_conflict(self, db: AsyncSession, job_id: str, existing: Any, incoming: Dict) -> bool:
        """Metadata reconciliation: Detects anomalies and creates admin tasks."""
        reasons = []
        if incoming['episodes_total'] > 0 and existing.episodes_total and incoming['episodes_total'] < existing.episodes_total:
             reasons.append("episode_regression")
        if abs(incoming['score'] - float(existing.score)) > 3.0:
             reasons.append("score_anomaly")
        if incoming['status'] == 'released' and existing.status == 'ongoing' and incoming['episodes_total'] == 0:
             reasons.append("status_sync_error")

        if reasons:
            await crud_conflicts.create(db, obj_in=ParserConflictCreate(
                parser_job_id=job_id,
                conflict_type=",".join(reasons),
                item_type="anime",
                item_id=existing.id,
                external_id=str(incoming['shikimori_id']),
                existing_data={"title": existing.title, "eps": existing.episodes_total, "score": float(existing.score), "status": existing.status},
                incoming_data=incoming
            ))
            return True
        return False

    async def run_sync_task(self, db: AsyncSession, job_id: str, config: Dict, mode: str = "incremental"):
        job = await crud_jobs.get(db, id=job_id)
        if not job: return
        
        await crud_jobs.update(db, db_obj=job, obj_in={"status": "running", "started_at": datetime.utcnow()})
        await self._add_log(db, job_id, "INFO", f"Sync Node Initialized. Mode: {mode}")
        
        stats = {"proc": 0, "create": 0, "update": 0, "fail": 0, "skip": 0}
        semaphore = asyncio.Semaphore(config.get('async_semaphores', 5))
        bl_settings = await crud_settings.get_by_category(db, "blacklist")
        blacklist = bl_settings.config if bl_settings else {}

        try:
            pages = 5 if mode == "incremental" else config.get('deep_sync_pages', 50)
            for page in range(1, pages + 1):
                params = {'page': page, 'limit': 50, 'order': 'ranked'}
                if mode == "incremental": params['order'] = 'updated'
                
                try:
                    items = await self._fetch_page(params)
                except Exception as e:
                    await self._add_log(db, job_id, "ERROR", f"Failed to fetch page {page} after retries: {str(e)}")
                    continue

                if not items: break
                
                async def _process_item(item):
                    async with semaphore:
                        try:
                            stats["proc"] += 1
                            details = await self.get_full_data(str(item['id']))
                            
                            if not details:
                                stats["skip"] += 1; return

                            if not await self._passes_filters(db, job_id, details, config, blacklist):
                                stats["skip"] += 1; return

                            mapped = self._apply_templates(details, config)
                            mapped['genres'] = await taxonomy_service.reconcile_genres(db, mapped['genres'])

                            if config.get('localize_images', True) and mapped['poster_url']:
                                try:
                                    mapped['poster_url'] = await media_service.process_image(
                                        mapped['poster_url'], "posters", mapped['slug'], config
                                    )
                                except Exception:
                                    await self._add_log(db, job_id, "ERROR", f"Media pipeline fault for {mapped['title']}")

                            existing = await crud_anime.get_by_shikimori_id(db, shikimori_id=mapped['shikimori_id'])
                            if existing:
                                if await self._detect_conflict(db, job_id, existing, mapped):
                                    stats["skip"] += 1; return
                                if config.get('auto_update', True):
                                    await crud_anime.update(db, db_obj=existing, obj_in=mapped)
                                    stats["update"] += 1
                            else:
                                await crud_anime.create(db, obj_in=mapped)
                                stats["create"] += 1

                            if stats["proc"] % 5 == 0:
                                await publish_job_progress(job_id, int((page/pages)*100), stats)

                        except Exception as e:
                            stats["fail"] += 1
                            await self._add_log(db, job_id, "ERROR", f"Ingestion error for ID {item.get('id')}: {str(e)}")

                await asyncio.gather(*[_process_item(item) for item in items])

                await asyncio.sleep(config.get('request_delay_ms', 200) / 1000)

            await crud_jobs.update(db, db_obj=job, obj_in={
                "status": "completed", 
                "progress": 100, 
                "completed_at": datetime.utcnow(),
                "items_processed": stats["proc"],
                "items_created": stats["create"],
                "items_updated": stats["update"],
                "items_failed": stats["fail"]
            })
            await publish_job_progress(job_id, 100, stats)
            await self._add_log(db, job_id, "INFO", f"Job finalized. Reconciled {stats['proc']} nodes.")
            
        except Exception as e:
            logger.exception(f"Sync_Fatal: Job {job_id}")
            await crud_jobs.update(db, db_obj=job, obj_in={"status": "failed", "error_message": str(e)})
