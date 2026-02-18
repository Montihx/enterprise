from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, select, delete
from uuid import UUID

from app.api import deps
from app.crud import (
    collection as crud_collection,
    comment as crud_comment,
    favorite as crud_favorite,
    watch_progress as crud_watch_progress,
)
from app.models.user import User
from app.models.interaction import Comment, Collection
from app.models.anime import Anime
from app.schemas.interaction import (
    Collection as CollectionSchema,
    CollectionCreate,
    CollectionUpdate,
    CollectionItemCreate,
    CommentCreate,
    CommentUpdate,
)
from app.services.audit_service import audit_service

router = APIRouter()


# ─── Comments: Read ──────────────────────────────────────────────────────────

@router.get("/comments", response_model=List[Any])
async def read_comments(
    db: AsyncSession = Depends(deps.get_db),
    anime_id: Optional[UUID] = None,
    episode_id: Optional[UUID] = None,
    parent_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """Get comments for anime/episode. Supports threaded replies via parent_id filter."""
    return await crud_comment.get_multi_by_target(
        db, anime_id=anime_id, episode_id=episode_id,
        parent_id=parent_id, skip=skip, limit=limit,
    )


# ─── Comments: Create ────────────────────────────────────────────────────────

@router.post("/comments", status_code=201, response_model=Any)
async def create_comment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    comment_in: CommentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a top-level comment or a reply (set parent_id for replies)."""
    return await crud_comment.create(
        db, obj_in=comment_in.model_dump(exclude_none=True), user_id=current_user.id
    )


# ─── Comments: Reply ─────────────────────────────────────────────────────────

@router.post("/comments/{id}/reply", status_code=201, response_model=Any)
async def reply_to_comment(
    id: UUID,
    *,
    db: AsyncSession = Depends(deps.get_db),
    content: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Reply to a specific comment. Enforces max thread depth of 3."""
    parent = await crud_comment.get(db, id=id)
    if not parent or parent.is_deleted or parent.is_hidden:
        raise HTTPException(status_code=404, detail="Parent comment not found")

    if parent.thread_depth >= 3:
        raise HTTPException(status_code=400, detail="Maximum reply depth reached")

    return await crud_comment.create(db, obj_in={
        "content": content,
        "parent_id": id,
        "thread_depth": parent.thread_depth + 1,
        "anime_id": parent.anime_id,
        "episode_id": parent.episode_id,
    }, user_id=current_user.id)


# ─── Comments: Like / Unlike ─────────────────────────────────────────────────

@router.post("/comments/{id}/like", response_model=Any)
async def toggle_comment_like(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Toggle like on a comment. Returns updated like count."""
    comment = await crud_comment.get(db, id=id)
    if not comment or comment.is_deleted:
        raise HTTPException(status_code=404, detail="Comment not found")

    liked = await crud_comment.toggle_like(db, comment_id=id, user_id=current_user.id)
    return {"liked": liked, "likes_count": comment.likes_count}


# ─── Comments: Update (owner or moderator) ───────────────────────────────────

@router.patch("/comments/{id}", response_model=Any)
async def update_comment(
    id: UUID,
    comment_in: CommentUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Edit own comment content."""
    comment = await crud_comment.get(db, id=id)
    if not comment or comment.is_deleted:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not your comment")

    return await crud_comment.update_comment(db, comment=comment, content=comment_in.content)


# ─── Comments: Delete (soft) ─────────────────────────────────────────────────

@router.delete("/comments/{id}", status_code=204)
async def delete_comment(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> None:
    """Soft-delete own comment (sets is_deleted=True, preserves thread structure)."""
    comment = await crud_comment.get(db, id=id)
    if not comment or comment.is_deleted:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not your comment")

    await crud_comment.soft_delete(db, comment=comment)
    await audit_service.log_action(
        db, actor_id=current_user.id, action="delete_comment",
        resource_type="comment", resource_id=id,
    )


# ─── Comments: Moderation ────────────────────────────────────────────────────

@router.get("/comments/staff-queue", response_model=List[Any])
async def read_comments_staff(
    db: AsyncSession = Depends(deps.get_db),
    is_hidden: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    u=Depends(deps.check_permissions(["comments.moderate"])),
) -> Any:
    query = select(Comment).order_by(Comment.created_at.desc())
    if is_hidden is not None:
        query = query.filter(Comment.is_hidden == is_hidden)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/comments/{id}/approve")
async def approve_comment(
    id: UUID,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    u=Depends(deps.check_permissions(["comments.moderate"])),
) -> Any:
    stmt = update(Comment).where(Comment.id == id).values(is_hidden=False)
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    await db.commit()
    await audit_service.log_action(
        db, actor_id=u.id, action="approve", resource_type="comment", resource_id=id,
        actor_ip=request.client.host if request.client else None,
    )
    return {"status": "approved"}


# ─── Collections ─────────────────────────────────────────────────────────────

@router.get("/collections/public", response_model=List[CollectionSchema])
async def read_public_collections(
    db: AsyncSession = Depends(deps.get_db), skip: int = 0, limit: int = 20,
) -> Any:
    stmt = (
        select(Collection)
        .where(Collection.is_public.is_(True))
        .order_by(Collection.updated_at.desc())
        .offset(skip).limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/collections/{slug_or_id}", response_model=CollectionSchema)
async def read_collection(slug_or_id: str, db: AsyncSession = Depends(deps.get_db)) -> Any:
    try:
        col_id = UUID(slug_or_id)
        col = await crud_collection.get(db, id=col_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="UUID required for direct access")
    if not col or not col.is_public:
        raise HTTPException(status_code=404, detail="Collection not found")
    return col


@router.get("/collections", response_model=List[CollectionSchema])
async def read_my_collections(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0, limit: int = 20,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await crud_collection.get_multi_by_user(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/collections", response_model=CollectionSchema, status_code=201)
async def create_collection(
    *,
    db: AsyncSession = Depends(deps.get_db),
    collection_in: CollectionCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    existing = await crud_collection.get_by_slug(db, user_id=current_user.id, slug=collection_in.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this slug already exists")
    return await crud_collection.create(db, obj_in={**collection_in.model_dump(), "user_id": current_user.id})


@router.patch("/collections/{id}", response_model=CollectionSchema)
async def update_collection(
    id: UUID,
    collection_in: CollectionUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    col = await crud_collection.get(db, id=id)
    if not col or col.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Collection not found")
    return await crud_collection.update(db, db_obj=col, obj_in=collection_in.model_dump(exclude_unset=True))


@router.delete("/collections/{id}", status_code=204)
async def delete_collection(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> None:
    col = await crud_collection.get(db, id=id)
    if not col or col.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Collection not found")
    await crud_collection.remove(db, id=id)


@router.post("/collections/{id}/items", status_code=201)
async def add_to_collection(
    id: UUID,
    item_in: CollectionItemCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    col = await crud_collection.get(db, id=id)
    if not col or col.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Collection not found")
    anime = await db.get(Anime, item_in.anime_id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return await crud_collection.add_item(db, collection_id=id, anime_id=item_in.anime_id, notes=item_in.notes)


# ─── Favorites ───────────────────────────────────────────────────────────────

@router.get("/favorites", response_model=List[Any])
async def read_favorites(
    db: AsyncSession = Depends(deps.get_db),
    category: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await crud_favorite.get_multi_by_user(db, user_id=current_user.id, category=category)


@router.post("/favorites")
async def toggle_favorite(
    *,
    db: AsyncSession = Depends(deps.get_db),
    anime_id: UUID,
    category: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    anime = await db.get(Anime, anime_id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime not found")
    return await crud_favorite.create_or_update(db, user_id=current_user.id, anime_id=anime_id, category=category)


# ─── Watch Progress ──────────────────────────────────────────────────────────

@router.post("/watch-progress")
async def update_watch_progress(
    *,
    db: AsyncSession = Depends(deps.get_db),
    episode_id: UUID,
    position: int,
    total: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await crud_watch_progress.update_progress(
        db, user_id=current_user.id, episode_id=episode_id, pos=position, total=total,
    )


@router.get("/watch-progress/continue", response_model=List[Any])
async def read_continue_watching(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return await crud_watch_progress.get_continue_watching(db, user_id=current_user.id)
