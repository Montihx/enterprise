import httpx
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.models.anime import Anime
from app.models.interaction import Favorite
from app.crud.crud_episode import episode as crud_episode
from app.crud.crud_release import release as crud_release
from app.crud.crud_parser import parser_job_log as crud_parser_logs
from app.schemas.episode import EpisodeCreate
from app.schemas.release import ReleaseCreate
from app.schemas.parser import ParserJobLogCreate
from app.core.config import settings
from app.services.notification_service import notification_service
from app.core.logging import logger

class KodikParserService:
    def __init__(self, proxy_config: Optional[Dict] = None):
        self.api_key = proxy_config.get('kodik_api_key') if proxy_config else settings.KODIK_API_KEY
        if not self.api_key:
            from app.core.logging import logger as _logger
            _logger.warning(
                "KodikParser: KODIK_API_KEY is not set. "
                "All requests will return 401. Set KODIK_API_KEY in your .env file."
            )
        self.client = httpx.AsyncClient(base_url=settings.KODIK_URL, timeout=20.0)

    def _ensure_api_key(self) -> None:
        if not self.api_key:
            raise ValueError(
                "KODIK_API_KEY is not configured. "
                "Add KODIK_API_KEY=your_key to your .env file."
            )

    async def close(self):
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
        reraise=True
    )
    async def _probe_cdn_node(self, kodik_id: str) -> Optional[Dict[str, Any]]:
        """Probe CDN for latest segments with retry logic."""
        res = await self.client.get('/search', params={
            'token': self.api_key, 
            'id': kodik_id, 
            'with_episodes': 'true'
        })
        res.raise_for_status()
        results = res.json().get('results', [])
        return results[0] if results else None

    async def sync_ongoing_releases(self, db: AsyncSession, job_id: Optional[str] = None):
        """
        Syncs all 'ongoing' anime with Kodik CDN.
        Automatically creates Release records and notifies users.
        """
        self._ensure_api_key()
        query = select(Anime).filter(Anime.status == 'ongoing', Anime.kodik_id.isnot(None))
        result = await db.execute(query)
        animes = result.scalars().all()
        
        if job_id:
            await crud_parser_logs.create(db, obj_in=ParserJobLogCreate(
                parser_job_id=job_id, level="INFO", message=f"Pulse: Scanning {len(animes)} active nodes"
            ))
        
        for anime in animes:
            try:
                material = await self._probe_cdn_node(anime.kodik_id)
                if not material: continue
                
                iframe_url = material.get('link')
                
                # 2. Extract max episode from CDN metadata
                cdn_episodes = []
                for season in material.get('seasons', {}).values():
                    for ep_num in season.keys():
                        try: cdn_episodes.append(int(ep_num))
                        except ValueError: continue
                
                max_ep_cdn = max(cdn_episodes) if cdn_episodes else 0
                
                # 3. Provision new segments if CDN is ahead of local registry
                if max_ep_cdn > anime.episodes_aired:
                    start_ep = anime.episodes_aired + 1
                    for ep_num in range(start_ep, max_ep_cdn + 1):
                        if job_id:
                            await crud_parser_logs.create(db, obj_in=ParserJobLogCreate(
                                parser_job_id=job_id, 
                                level="INFO", 
                                message=f"Provisioning: {anime.title} Episode {ep_num}",
                                item_id=str(anime.id),
                                item_type="anime"
                            ))
                        
                        # Episode Record
                        new_ep = await crud_episode.create(db, obj_in=EpisodeCreate(
                            anime_id=anime.id, 
                            episode=ep_num, 
                            season=1,
                            title=f"Эпизод {ep_num}"
                        ))
                        
                        # Release Node (CDN Endpoint)
                        await crud_release.create(db, obj_in=ReleaseCreate(
                            episode_id=new_ep.id,
                            source='kodik',
                            quality='1080p',
                            url=iframe_url,
                            embed_url=f"{iframe_url}?episode={ep_num}",
                            translation_type='voice',
                            is_active=True
                        ))
                    
                    # Update local state
                    anime.episodes_aired = max_ep_cdn
                    db.add(anime)
                    
                    # 4. Notify Watchers
                    fav_query = select(Favorite.user_id).filter(
                        Favorite.anime_id == anime.id,
                        Favorite.category == 'watching'
                    )
                    fav_res = await db.execute(fav_query)
                    watchers = fav_res.scalars().all()
                    
                    if watchers:
                        await notification_service.broadcast_to_users(
                            db,
                            user_ids=watchers,
                            title=f"Новый эпизод: {anime.title}",
                            message=f"Серия {max_ep_cdn} уже доступна в HD.",
                            type="new_episode",
                            target_id=anime.id,
                            icon=anime.poster_url
                        )
                    
            except Exception as e:
                logger.error(f"Pulse_Sync_Fault: {anime.title}", error=str(e))
        
        await db.commit()
