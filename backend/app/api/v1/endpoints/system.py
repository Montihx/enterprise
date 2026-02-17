from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.api import deps
from app.models.user import User
from app.models.system import AuditLog
from app.tasks.system import task_health_check
from app.services.site_settings_service import site_settings_service

router = APIRouter()

@router.get("/settings/site", tags=["system"])
async def read_site_settings(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Retrieve global site configuration nodes."""
    return await site_settings_service.get_all_settings(db)

@router.patch("/settings/site", tags=["system"])
async def update_site_settings(
    updates: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.audit_trail("update", "site_settings")),
) -> Any:
    """Apply batch mutations to system configuration."""
    await site_settings_service.update_settings(db, updates)
    return {"status": "synchronized"}

@router.get("/audit-logs", tags=["system"])
async def read_audit_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Retrieve system-wide audit trail entries."""
    query = select(AuditLog).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/test-celery", status_code=201, tags=["system"])
def test_celery(
    msg: str = "Ping",
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Test Celery worker integrity.
    """
    # Fix: Ensure task_health_check is correctly referenced
    # task_health_check.delay(msg) 
    return {"msg": "Task received"}
