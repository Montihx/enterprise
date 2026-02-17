from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, update
from uuid import UUID
from pydantic import BaseModel

from app.api import deps
from app.models.anime import Anime
from app.models.episode import Episode
from app.models.release import Release
from app.core.logging import logger
from app.core.cache import cache

router = APIRouter()

class BulkActionRequest(BaseModel):
    ids: List[UUID]
    action: str # 'delete' or 'update_status'
    new_status: Optional[str] = None

@router.post("/anime", status_code=status.HTTP_200_OK)
async def bulk_anime_ops(
    request: BulkActionRequest,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.audit_trail("bulk_anime", "anime"))
) -> Any:
    """
    Perform batch operations on Anime entities.
    Automatically triggers cache invalidation upon completion.
    """
    if request.action == 'delete':
        stmt = delete(Anime).where(Anime.id.in_(request.ids))
        result = await db.execute(stmt)
        await db.commit()
        await cache.clear_prefix("catalog")
        logger.info("Bulk Op: Anime Registry Purge", count=result.rowcount, actor=u.id)
        return {"processed": result.rowcount, "cache": "invalidated"}
    
    if request.action == 'update_status' and request.new_status:
        stmt = update(Anime).where(Anime.id.in_(request.ids)).values(status=request.new_status)
        result = await db.execute(stmt)
        await db.commit()
        await cache.clear_prefix("catalog")
        return {"processed": result.rowcount}

    raise HTTPException(status_code=400, detail="Unsupported bulk action or missing metadata")

@router.post("/episodes", status_code=status.HTTP_200_OK)
async def bulk_episode_ops(
    request: BulkActionRequest,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.audit_trail("bulk_episodes", "episode"))
) -> Any:
    """
    Perform batch operations on Episode segments.
    """
    if request.action == 'delete':
        stmt = delete(Episode).where(Episode.id.in_(request.ids))
        result = await db.execute(stmt)
        await db.commit()
        return {"processed": result.rowcount}
    
    raise HTTPException(status_code=400, detail="Unsupported bulk action")