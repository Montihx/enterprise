
from typing import List, Optional, Union, Dict, Any, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from app.models.anime import Anime
from app.schemas.anime import AnimeCreate, AnimeUpdate
from app.crud.base import CRUDBase

class CRUDAnime(CRUDBase[Anime, AnimeCreate, AnimeUpdate]):
    async def get_by_slug(self, db: AsyncSession, *, slug: str) -> Optional[Anime]:
        result = await db.execute(select(Anime).filter(Anime.slug == slug))
        return result.scalars().first()

    async def get_by_shikimori_id(self, db: AsyncSession, *, shikimori_id: int) -> Optional[Anime]:
        result = await db.execute(select(Anime).filter(Anime.shikimori_id == shikimori_id))
        return result.scalars().first()

    async def get_multi_paginated(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        genre: Optional[str] = None,
        **filters
    ) -> Tuple[List[Anime], int]:
        query = select(Anime)
        
        # Enterprise Search with Rank
        if search:
            search_query = func.plainto_tsquery('simple', search)
            rank = func.ts_rank_cd(Anime.search_vector, search_query)
            query = query.filter(Anime.search_vector.op("@@")(search_query))
            query = query.order_by(desc(rank))
        else:
            query = query.order_by(desc(Anime.score_count), desc(Anime.score))

        # Dynamic Filters
        for key, value in filters.items():
            if value and hasattr(Anime, key):
                query = query.filter(getattr(Anime, key) == value)
        
        # JSONB Array Filter (Postgres existence operator)
        if genre:
            query = query.filter(Anime.genres.op("?")(genre))

        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0
        
        result = await db.execute(query.offset(skip).limit(limit))
        items = result.scalars().all()
        return items, total

    async def delete(self, db: AsyncSession, *, id: UUID) -> Anime:
        result = await db.execute(select(Anime).filter(Anime.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
        return db_obj

anime = CRUDAnime(Anime)
