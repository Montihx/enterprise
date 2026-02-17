from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api import deps
from app.crud.crud_release import release as crud_release
from app.schemas.release import Release, ReleaseCreate, ReleaseUpdate
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("/", response_model=List[Release])
async def read_releases(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve all distributed releases."""
    return await crud_release.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Release, status_code=201)
async def create_release(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    release_in: ReleaseCreate,
    u = Depends(deps.check_permissions(["content.edit"])),
) -> Any:
    """Provision new video distribution node."""
    release = await crud_release.create(db, obj_in=release_in)
    await audit_service.log_action(
        db, actor_id=u.id, action="create", resource_type="release", 
        resource_id=release.id, actor_ip=request.client.host if request.client else None
    )
    return release

@router.get("/{id}", response_model=Release)
async def read_release(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
) -> Any:
    """Get release node by ID."""
    release = await crud_release.get(db, id=id)
    if not release:
        raise HTTPException(status_code=404, detail="Release node not found")
    return release

@router.patch("/{id}", response_model=Release)
async def update_release(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
    release_in: ReleaseUpdate,
    u = Depends(deps.check_permissions(["content.edit"])),
) -> Any:
    """Patch release logic or endpoint URL."""
    release = await crud_release.get(db, id=id)
    if not release:
        raise HTTPException(status_code=404, detail="Release node not found")
    release = await crud_release.update(db, db_obj=release, obj_in=release_in)
    await audit_service.log_action(
        db, actor_id=u.id, action="update", resource_type="release", 
        resource_id=id, actor_ip=request.client.host if request.client else None
    )
    return release

@router.delete("/{id}", response_model=Release)
async def delete_release(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
    u = Depends(deps.check_permissions(["content.edit"])),
) -> Any:
    """Purge video distribution node."""
    release = await crud_release.get(db, id=id)
    if not release:
        raise HTTPException(status_code=404, detail="Release node not found")
    release = await crud_release.delete(db, id=id)
    await audit_service.log_action(
        db, actor_id=u.id, action="delete", resource_type="release", 
        resource_id=id, actor_ip=request.client.host if request.client else None
    )
    return release
