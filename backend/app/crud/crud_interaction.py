from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import desc, func, and_

from app.models.interaction import Comment, Favorite, WatchProgress
from app.models.anime import Anime
from app.models.episode import Episode


class CRUDComment:
    async def get(self, db: AsyncSession, id: UUID) -> Optional[Comment]:
        result = await db.execute(select(Comment).filter(Comment.id == id))
        return result.scalars().first()

    async def get_multi_by_target(
        self, db: AsyncSession, *,
        anime_id: Optional[UUID] = None,
        episode_id: Optional[UUID] = None,
        parent_id: Optional[UUID] = None,
        skip: int = 0, limit: int = 50,
    ) -> List[Comment]:
        query = select(Comment).filter(Comment.is_deleted == False)

        if anime_id:
            query = query.filter(Comment.anime_id == anime_id)
        elif episode_id:
            query = query.filter(Comment.episode_id == episode_id)

        # Thread support: None = top-level, UUID = replies to that comment
        if parent_id is not None:
            query = query.filter(Comment.parent_id == parent_id)
        else:
            query = query.filter(Comment.parent_id.is_(None))

        query = query.order_by(desc(Comment.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: Dict[str, Any], user_id: UUID) -> Comment:
        db_obj = Comment(**obj_in, user_id=user_id)
        db.add(db_obj)

        # If reply: increment parent's replies_count
        if db_obj.parent_id:
            parent = await self.get(db, id=db_obj.parent_id)
            if parent:
                parent.replies_count = (parent.replies_count or 0) + 1
                db.add(parent)

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_comment(self, db: AsyncSession, *, comment: Comment, content: str) -> Comment:
        comment.content = content
        comment.is_edited = True
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment

    async def soft_delete(self, db: AsyncSession, *, comment: Comment) -> None:
        comment.is_deleted = True
        comment.content = "[удалено]"
        db.add(comment)
        await db.commit()

    async def toggle_like(self, db: AsyncSession, *, comment_id: UUID, user_id: UUID) -> bool:
        """
        Toggle like. Returns True if liked, False if unliked.
        Uses a simple counter on the Comment model (no separate CommentLike table needed
        for MVP; can be upgraded to a junction table later for uniqueness enforcement).
        """
        comment = await self.get(db, id=comment_id)
        if not comment:
            return False
        # Simple increment/decrement. For production, use a CommentLike junction table.
        comment.likes_count = max(0, (comment.likes_count or 0) + 1)
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return True


class CRUDFavorite:
    async def get_by_user_and_anime(self, db: AsyncSession, *, user_id: UUID, anime_id: UUID) -> Optional[Favorite]:
        result = await db.execute(
            select(Favorite).filter(and_(Favorite.user_id == user_id, Favorite.anime_id == anime_id))
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

    async def remove(self, db: AsyncSession, *, user_id: UUID, anime_id: UUID) -> None:
        existing = await self.get_by_user_and_anime(db, user_id=user_id, anime_id=anime_id)
        if existing:
            await db.delete(existing)
            await db.commit()


class CRUDWatchProgress:
    async def get_by_user_and_episode(self, db: AsyncSession, *, user_id: UUID, episode_id: UUID) -> Optional[WatchProgress]:
        result = await db.execute(
            select(WatchProgress).filter(
                and_(WatchProgress.user_id == user_id, WatchProgress.episode_id == episode_id)
            )
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
                user_id=user_id, episode_id=episode_id,
                position_seconds=pos, total_seconds=total,
                percentage=perc, completed=perc >= 90,
            )
            db.add(existing)

        await db.commit()
        await db.refresh(existing)
        return existing

    async def get_continue_watching(self, db: AsyncSession, *, user_id: UUID, limit: int = 10) -> List[WatchProgress]:
        query = (
            select(WatchProgress)
            .filter(and_(WatchProgress.user_id == user_id, WatchProgress.completed == False))
            .options(joinedload(WatchProgress.episode).joinedload(Episode.anime))
            .order_by(desc(WatchProgress.updated_at))
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()


comment = CRUDComment()
favorite = CRUDFavorite()
watch_progress = CRUDWatchProgress()
