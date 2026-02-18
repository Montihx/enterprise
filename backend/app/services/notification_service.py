from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.crud_notification import notification as crud_notification
from app.schemas.notification import NotificationCreate
from app.models.interaction import Favorite
from app.models.user import User
from app.core.logging import logger


class NotificationService:
    async def broadcast_to_users(
        self,
        db: AsyncSession,
        user_ids: List[UUID],
        title: str,
        message: str,
        type: str = "info",
        target_id: Optional[UUID] = None,
        icon: Optional[str] = None,
    ):
        """Send notification to a list of users."""
        for uid in user_ids:
            await crud_notification.create(
                db,
                obj_in=NotificationCreate(
                    user_id=uid,
                    title=title,
                    message=message,
                    type=type,
                    target_id=target_id,
                    icon=icon,
                ),
            )

    async def notify_users_new_episode(
        self,
        db: AsyncSession,
        anime_id: UUID,
        anime_title: str,
        anime_slug: str,
        episode_number: int,
        episode_id: Optional[UUID] = None,
    ):
        """
        Notify all users who have this anime in their 'watching' or 'planned' list
        that a new episode is available.
        """
        # Find all users watching this anime
        result = await db.execute(
            select(Favorite).filter(
                Favorite.anime_id == anime_id,
                Favorite.category.in_(["watching", "planned"]),
            )
        )
        favorites = result.scalars().all()

        if not favorites:
            return

        user_ids = [f.user_id for f in favorites]
        title = f"Новый эпизод — {anime_title}"
        message = f"Вышел эпизод #{episode_number}"

        logger.info(
            "Sending new episode notifications",
            anime=anime_title,
            episode=episode_number,
            recipients=len(user_ids),
        )

        await self.broadcast_to_users(
            db,
            user_ids=user_ids,
            title=title,
            message=message,
            type="new_episode",
            target_id=episode_id,
            icon="🎬",
        )

        # Also attempt email notifications (non-blocking)
        try:
            from app.services.email_service import email_service
            users_result = await db.execute(
                select(User).filter(User.id.in_(user_ids), User.is_active == True)
            )
            users = users_result.scalars().all()
            for user in users:
                try:
                    email_service.send_new_episode_notification(
                        user.email, user.username, anime_title, episode_number, anime_slug
                    )
                except Exception:
                    pass  # Don't fail on individual email errors
        except Exception as e:
            logger.error("Email notification batch failed", error=str(e))

    async def notify_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        title: str,
        message: str,
        type: str = "info",
        target_id: Optional[UUID] = None,
    ):
        """Send a single notification to one user."""
        await self.broadcast_to_users(
            db, user_ids=[user_id], title=title, message=message,
            type=type, target_id=target_id,
        )


notification_service = NotificationService()
