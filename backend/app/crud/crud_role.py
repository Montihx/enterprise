
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate

class CRUDRole:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[Role]:
        result = await db.execute(select(Role).filter(Role.id == id))
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Role]:
        result = await db.execute(select(Role).filter(Role.name == name))
        return result.scalars().first()
    
    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Role]:
        result = await db.execute(select(Role).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: RoleCreate) -> Role:
        db_obj = Role(
            name=obj_in.name,
            description=obj_in.description,
            permissions=obj_in.permissions
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

role = CRUDRole()
