
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.models.release import Release
from app.schemas.release import ReleaseCreate, ReleaseUpdate

class CRUDRelease:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[Release]:
        result = await db.execute(select(Release).filter(Release.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[Release]:
        query = select(Release).order_by(desc(Release.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_multi_by_episode(
        self, db: AsyncSession, *, episode_id: UUID
    ) -> List[Release]:
        query = select(Release).filter(Release.episode_id == episode_id)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: ReleaseCreate) -> Release:
        db_obj = Release(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: Release, obj_in: Union[ReleaseUpdate, Dict[str, Any]]
    ) -> Release:
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

    async def delete(self, db: AsyncSession, *, id: UUID) -> Release:
        result = await db.execute(select(Release).filter(Release.id == id))
        db_obj = result.scalars().first()
        if db_obj:
            await db.delete(db_obj)
            await db.commit()
        return db_obj

release = CRUDRelease()
