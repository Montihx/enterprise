from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, update
from app.models.interaction import Collection, CollectionItem
from app.schemas.interaction import CollectionCreate, CollectionUpdate
from app.crud.base import CRUDBase

class CRUDCollection(CRUDBase[Collection, CollectionCreate, CollectionUpdate]):
    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> List[Collection]:
        query = (
            select(Collection)
            .filter(Collection.user_id == user_id)
            .order_by(desc(Collection.updated_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_slug(self, db: AsyncSession, *, user_id: UUID, slug: str) -> Optional[Collection]:
        result = await db.execute(
            select(Collection).filter(Collection.user_id == user_id, Collection.slug == slug)
        )
        return result.scalars().first()

    async def add_item(
        self, db: AsyncSession, *, collection_id: UUID, anime_id: UUID, notes: Optional[str] = None
    ) -> CollectionItem:
        # Get current max position
        pos_query = select(func.max(CollectionItem.position)).filter(CollectionItem.collection_id == collection_id)
        pos_result = await db.execute(pos_query)
        max_pos = pos_result.scalar() or 0
        
        db_obj = CollectionItem(
            collection_id=collection_id,
            anime_id=anime_id,
            position=max_pos + 1,
            notes=notes
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

from sqlalchemy import func
collection = CRUDCollection(Collection)