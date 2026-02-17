
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.models.interaction import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate

class CRUDNotification:
    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> List[Notification]:
        query = (
            select(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()

    async def get_unread_count(self, db: AsyncSession, *, user_id: UUID) -> int:
        query = select(Notification).filter(Notification.user_id == user_id, Notification.is_read == False) # noqa
        result = await db.execute(query)
        return len(result.scalars().all())

    async def create(self, db: AsyncSession, *, obj_in: NotificationCreate) -> Notification:
        db_obj = Notification(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def mark_as_read(self, db: AsyncSession, *, id: UUID, user_id: UUID) -> Optional[Notification]:
        result = await db.execute(
            select(Notification).filter(Notification.id == id, Notification.user_id == user_id)
        )
        notification = result.scalars().first()
        if notification:
            notification.is_read = True
            db.add(notification)
            await db.commit()
            await db.refresh(notification)
        return notification

    async def mark_all_as_read(self, db: AsyncSession, *, user_id: UUID) -> None:
        # Note: bulk updates in async sqlalchemy require specific syntax or iteration
        result = await db.execute(
            select(Notification).filter(Notification.user_id == user_id, Notification.is_read == False) # noqa
        )
        notifications = result.scalars().all()
        for n in notifications:
            n.is_read = True
            db.add(n)
        await db.commit()

notification = CRUDNotification()
