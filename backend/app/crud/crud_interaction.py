from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import desc, func

from app.models.interaction import Comment, Favorite, WatchProgress
from app.models.anime import Anime
from app.models.episode import Episode
from app.schemas.common import ResponseMeta

class CRUDComment:
    async def get_multi_by_target(
        self, db: AsyncSession, *, anime_id: Optional[UUID] = None, episode_id: Optional[UUID] = None, skip: int = 0, limit: int = 50
    ) -> List[Comment]:
        query = select(Comment)
        if anime_id:
            query = query.filter(Comment.anime_id == anime_id)
        elif episode_id:
            query = query.filter(Comment.episode_id == episode_id)
        
        query = query.order_by(desc(Comment.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: Dict[str, Any], user_id: UUID) -> Comment:
        db_obj = Comment(**obj_in, user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

class CRUDFavorite:
    async def get_by_user_and_anime(self, db: AsyncSession, *, user_id: UUID, anime_id: UUID) -> Optional[Favorite]:
        result = await db.execute(
            select(Favorite).filter(Favorite.user_id == user_id, Favorite.anime_id == anime_id)
        )
        return result.scalars().first()

    async def get_multi_by_user(self, db: AsyncSession, *, user_id: UUID, category: Optional[str] = None) -> List[Favorite]:
        query = select(Favorite).filter(Favorite.user_id == user_id)
        if category:
            query = query.filter(Favorite.category == category)
        result = await db.execute(query)
        return result.scalars().all()

    async def create_or_update(self, db: AsyncSession, *, user_id: UUID, anime_id: UUID, category: str) -> Favorite:
        existing = await self.get_by_user_and_anime(db, user_id=user_id, anime_id=anime_id)
        if existing:
            existing.category = category
            db.add(existing)
        else:
            existing = Favorite(user_id=user_id, anime_id=anime_id, category=category)
            db.add(existing)
        
        await db.commit()
        await db.refresh(existing)
        return existing

class CRUDWatchProgress:
    async def get_by_user_and_episode(self, db: AsyncSession, *, user_id: UUID, episode_id: UUID) -> Optional[WatchProgress]:
        result = await db.execute(
            select(WatchProgress).filter(WatchProgress.user_id == user_id, WatchProgress.episode_id == episode_id)
        )
        return result.scalars().first()

    async def update_progress(self, db: AsyncSession, *, user_id: UUID, episode_id: UUID, pos: int, total: int) -> WatchProgress:
        existing = await self.get_by_user_and_episode(db, user_id=user_id, episode_id=episode_id)
        perc = (pos / total * 100) if total > 0 else 0
        
        if existing:
            existing.position_seconds = pos
            existing.total_seconds = total
            existing.percentage = perc
            existing.completed = perc >= 90
            db.add(existing)
        else:
            existing = WatchProgress(
                user_id=user_id, 
                episode_id=episode_id, 
                position_seconds=pos, 
                total_seconds=total,
                percentage=perc,
                completed=perc >= 90
            )
            db.add(existing)
            
        await db.commit()
        await db.refresh(existing)
        return existing

    async def get_continue_watching(self, db: AsyncSession, *, user_id: UUID, limit: int = 10) -> List[WatchProgress]:
        """
        Fetch items the user is currently watching, excluding completed ones (perc < 95).
        Returns episodes with joined anime metadata for the UI cards.
        """
        query = (
            select(WatchProgress)
            .filter(WatchProgress.user_id == user_id)
            .filter(WatchProgress.completed == False)
            .options(
                joinedload(WatchProgress.episode).joinedload(Episode.anime)
            )
            .order_by(desc(WatchProgress.updated_at))
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

comment = CRUDComment()
favorite = CRUDFavorite()
watch_progress = CRUDWatchProgress()
