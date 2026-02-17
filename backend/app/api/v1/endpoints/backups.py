
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api import deps
from app.services.backup_service import backup_service
from app.models.system import Backup
from app.schemas.common import DataResponse

router = APIRouter()

@router.get("/", tags=["backups"])
async def list_backups(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """List all database snapshots recorded in the registry."""
    result = await db.execute(select(Backup).order_by(Backup.created_at.desc()))
    return result.scalars().all()

@router.post("/", tags=["backups"], status_code=201)
async def trigger_backup(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Trigger a manual database snapshot and record it in the registry.
    """
    try:
        # 1. Execute physical backup
        result = await backup_service.create_backup(created_by_id=str(current_user.id))
        
        # 2. Record metadata in Database
        db_backup = Backup(
            filename=result['filename'],
            type='manual',
            size_bytes=result['size_bytes'],
            storage_path=result['storage_path'],
            status='completed',
            created_by=current_user.id
        )
        db.add(db_backup)
        await db.commit()
        await db.refresh(db_backup)
        
        return {"message": "Backup completed and registered", "data": db_backup}
    except Exception as e:
        logger.error("Backup Gateway: Critical Fault", error=str(e))
        raise HTTPException(status_code=500, detail=f"Disaster Recovery Fault: {str(e)}")

@router.delete("/{id}", tags=["backups"])
async def delete_backup(
    id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """Purge a backup record and delete the physical file."""
    try:
        uuid_obj = UUID(id)
        result = await db.execute(select(Backup).filter(Backup.id == uuid_obj))
    except (ValueError, NameError):
        # Allow filename deletion if id is not UUID
        result = await db.execute(select(Backup).filter(Backup.filename == id))
        
    backup = result.scalars().first()
    
    if not backup:
        raise HTTPException(status_code=404, detail="Backup record not found")
    
    # 1. Delete physical file
    filepath = backup_service.backup_dir / backup.filename
    if filepath.exists():
        filepath.unlink()
    
    # 2. Remove from DB
    await db.delete(backup)
    await db.commit()
    
    return {"message": "Backup archive and registry record purged"}

from uuid import UUID
from app.core.logging import logger
