from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime, timedelta

from app.api import deps
from app.crud.crud_parser import scheduled_job as crud_scheduled, parser_job as crud_jobs
from app.schemas.parser import ScheduledJob, ScheduledJobCreate, ScheduledJobUpdate
from app.tasks.parsers import run_full_sync_task, run_incremental_sync_task, run_release_updates_task
from app.services.audit_service import audit_service

router = APIRouter()

@router.get("/jobs", response_model=List[ScheduledJob])
async def list_scheduled_jobs(
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.get_current_active_superuser)
):
    """Retrieve all automated ingestion rules."""
    return await crud_scheduled.get_multi(db)

@router.post("/jobs", response_model=ScheduledJob, status_code=201)
async def create_scheduled_job(
    obj_in: ScheduledJobCreate,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.audit_trail("create_schedule", "parser"))
):
    """Register a new cron-based ingestion node."""
    return await crud_scheduled.create(db, obj_in={**obj_in.model_dump(), "created_by": u.id})

@router.patch("/jobs/{id}", response_model=ScheduledJob)
async def update_scheduled_job(
    id: UUID,
    obj_in: ScheduledJobUpdate,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.audit_trail("update_schedule", "parser"))
):
    """Toggle status or update cron periodicity."""
    db_obj = await crud_scheduled.get(db, id=id)
    if not db_obj: raise HTTPException(status_code=404)
    return await crud_scheduled.update(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/jobs/{id}")
async def delete_scheduled_job(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.audit_trail("delete_schedule", "parser"))
):
    """Purge an automated ingestion rule."""
    await crud_scheduled.delete(db, id=id)
    return {"status": "purged"}

@router.post("/jobs/{id}/run-now")
async def trigger_schedule_immediately(
    id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    u = Depends(deps.get_current_active_superuser)
):
    """Manually bypass cron constraints to run a task immediately."""
    job_cfg = await crud_scheduled.get(db, id=id)
    if not job_cfg: raise HTTPException(status_code=404)
    
    # Create an execution instance (ParserJob)
    job = await crud_jobs.create(db, obj_in={
        "parser_name": job_cfg.parser_name,
        "job_type": job_cfg.job_type
    })
    
    # Dispatch task
    if job_cfg.parser_name == "shikimori":
        if job_cfg.job_type == "full_sync": run_full_sync_task.delay(str(job.id))
        else: run_incremental_sync_task.delay(str(job.id))
    elif job_cfg.parser_name == "kodik":
        run_release_updates_task.delay(str(job.id))
        
    # Update last run
    await crud_scheduled.update(db, db_obj=job_cfg, obj_in={"last_run_at": datetime.utcnow()})
    
    return {"job_id": job.id, "status": "dispatched"}
