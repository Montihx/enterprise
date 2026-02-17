from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api import deps
from app.crud.crud_episode import episode as crud_episode
from app.crud.crud_release import release as crud_release
from app.schemas.episode import Episode, EpisodeCreate, EpisodeUpdate
from app.schemas.release import Release
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("/", response_model=List[Episode])
async def read_episodes(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve episodes."""
    return await crud_episode.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Episode, status_code=201)
async def create_episode(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    episode_in: EpisodeCreate,
    u = Depends(deps.check_permissions(["content.edit"])),
) -> Any:
    """Create new episode node."""
    episode = await crud_episode.create(db, obj_in=episode_in)
    await audit_service.log_action(
        db, actor_id=u.id, action="create", resource_type="episode", 
        resource_id=episode.id, actor_ip=request.client.host if request.client else None
    )
    return episode

@router.get("/{id}", response_model=Episode)
async def read_episode(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
) -> Any:
    """Get episode by ID."""
    episode = await crud_episode.get(db, id=id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode

@router.get("/{id}/releases", response_model=List[Release])
async def read_episode_releases(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """Get all distribution releases for a specific episode."""
    return await crud_release.get_multi_by_episode(db, episode_id=id)

@router.patch("/{id}", response_model=Episode)
async def update_episode(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
    episode_in: EpisodeUpdate,
    u = Depends(deps.check_permissions(["content.edit"])),
) -> Any:
    """Update episode metadata."""
    episode = await crud_episode.get(db, id=id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    episode = await crud_episode.update(db, db_obj=episode, obj_in=episode_in)
    await audit_service.log_action(
        db, actor_id=u.id, action="update", resource_type="episode", 
        resource_id=id, actor_ip=request.client.host if request.client else None
    )
    return episode

@router.delete("/{id}", response_model=Episode)
async def delete_episode(
    *,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    id: UUID,
    u = Depends(deps.check_permissions(["content.edit"])),
) -> Any:
    """Purge episode node."""
    episode = await crud_episode.get(db, id=id)
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    episode = await crud_episode.delete(db, id=id)
    await audit_service.log_action(
        db, actor_id=u.id, action="delete", resource_type="episode", 
        resource_id=id, actor_ip=request.client.host if request.client else None
    )
    return episode
