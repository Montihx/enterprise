
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.models.episode import Episode
from app.models.anime import Anime
from app.schemas.episode import EpisodeCreate, EpisodeUpdate

class CRUDEpisode:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[Episode]:
        result = await db.execute(select(Episode).filter(Episode.id == id))
        return result.scalars().first()

    async def get_multi_by_anime(
        self, db: AsyncSession, *, anime_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Episode]:
        query = (
            select(Episode)
            .filter(Episode.anime_id == anime_id)
            .order_by(Episode.season, Episode.episode)
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[Episode]:
        query = select(Episode).order_by(desc(Episode.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: EpisodeCreate) -> Episode:
        db_obj = Episode(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Episode, obj_in: Union[EpisodeUpdate, Dict[str, Any]]
    ) -> Episode:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: UUID) -> Episode:
        result = await db.execute(select(Episode).filter(Episode.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
        return db_obj

episode = CRUDEpisode()
