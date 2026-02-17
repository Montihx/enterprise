from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.crud_notification import notification as crud_notification
from app.schemas.notification import NotificationCreate
from app.models.interaction import Favorite, User

class NotificationService:
    async def broadcast_to_users(
        self,
        db: AsyncSession,
        user_ids: List[UUID],
        title: str,
        message: str,
        type: str = "info",
        target_id: Optional[UUID] = None,
        icon: Optional[str] = None
    ):
        """Dispatches a notification node to a specific cluster of users."""
        for uid in user_ids:
            await crud_notification.create(db, obj_in=NotificationCreate(
                user_id=uid,
                title=title,
                message=message,
                type=type,
                target_id=target_id,
                icon=icon
            ))

    async def notify_users_new_episode(self, *args, **kwargs):
        """DEPRECATED: Use broadcast_to_users with filtered list logic."""
        pass

notification_service = NotificationService()
