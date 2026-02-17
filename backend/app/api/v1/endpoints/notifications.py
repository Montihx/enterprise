
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api import deps
from app.crud.crud_notification import notification as crud_notification
from app.schemas.notification import Notification

router = APIRouter()

@router.get("/", response_model=List[Notification])
async def read_notifications(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 20,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's notifications.
    """
    return await crud_notification.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )

@router.get("/unread-count", response_model=int)
async def get_unread_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get count of unread notifications.
    """
    return await crud_notification.get_unread_count(db, user_id=current_user.id)

@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark all notifications as read.
    """
    await crud_notification.mark_all_as_read(db, user_id=current_user.id)
    return {"status": "success"}

@router.patch("/{id}/read", response_model=Notification)
async def mark_read(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark a single notification as read.
    """
    notification = await crud_notification.mark_as_read(db, id=id, user_id=current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
