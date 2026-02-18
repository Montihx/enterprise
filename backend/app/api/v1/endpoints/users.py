from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, Path, UploadFile, File, Form
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api import deps
from app.crud.crud_user import user as crud_user
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate, UserAdminUpdate

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve users.
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    *,
    db: AsyncSession = Depends(deps.get_db),
    password: str = Body(None),
    full_name: str = Body(None),
    email: str = Body(None),
    avatar_url: str = Body(None),
    bio: str = Body(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update own user profile (name, email, avatar, bio)."""
    update_data: dict = {}
    if password is not None:
        update_data["password"] = password
    if full_name is not None:
        update_data["full_name"] = full_name
    if email is not None:
        update_data["email"] = email
    if avatar_url is not None:
        update_data["avatar_url"] = avatar_url
    if bio is not None:
        update_data["bio"] = bio
    user = await crud_user.update(db, db_obj=current_user, obj_in=update_data)
    return user


@router.post("/me/avatar", response_model=UserSchema)
async def upload_avatar(
    *,
    db: AsyncSession = Depends(deps.get_db),
    file: UploadFile = File(..., description="Avatar image (JPEG, PNG, WebP, max 5MB)"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Upload a real avatar image. Returns updated user with new avatar_url."""
    import os, uuid
    from pathlib import Path as FilePath

    # Validate content type
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {file.content_type}. Allowed: JPEG, PNG, WebP, GIF"
        )

    # Read and check size
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")

    # Save to media/avatars/
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    media_dir = FilePath("/app/media/avatars")
    media_dir.mkdir(parents=True, exist_ok=True)

    filepath = media_dir / filename
    filepath.write_bytes(contents)

    avatar_url = f"/media/avatars/{filename}"
    user = await crud_user.update(db, db_obj=current_user, obj_in={"avatar_url": avatar_url})
    return user

# --- Admin Endpoints ---

@router.get("/{user_id}", response_model=UserSchema)
async def read_user_by_id(
    user_id: UUID,
    current_user: User = Depends(deps.get_current_active_superuser),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get a specific user by id.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    return user

@router.patch("/{user_id}", response_model=UserSchema)
async def update_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: UUID,
    user_in: UserAdminUpdate,
    current_user: User = Depends(deps.audit_trail("update", "user")),
) -> Any:
    """
    Update a user (Admin). Can update role, status, etc.
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    user = await crud_user.update(db, db_obj=user, obj_in=user_in)
    return user

@router.post("/{user_id}/ban", response_model=UserSchema)
async def ban_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: UUID,
    current_user: User = Depends(deps.audit_trail("ban", "user")),
) -> Any:
    """
    Ban a user (Set is_active=False).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="Cannot ban a superuser")

    user = await crud_user.update(db, db_obj=user, obj_in={"is_active": False})
    return user

@router.post("/{user_id}/unban", response_model=UserSchema)
async def unban_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: UUID,
    current_user: User = Depends(deps.audit_trail("unban", "user")),
) -> Any:
    """
    Unban a user (Set is_active=True).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user = await crud_user.update(db, db_obj=user, obj_in={"is_active": True})
    return user
