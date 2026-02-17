import time
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.core.celery_app import celery_app
from app.core.logging import logger
from app.services.backup_service import backup_service
from app.db.session import AsyncSessionLocal
from app.models.parser import ScheduledParserJob
from app.tasks.parsers import run_full_sync_task, run_incremental_sync_task

@celery_app.task(name="system.automated_daily_backup")
def task_automated_backup():
    logger.info("Backup Pipeline: Executing daily system snapshot...")
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(backup_service.create_backup())
        return True
    except Exception as e:
        logger.error(f"Backup Pipeline: Snapshot failure", error=str(e))
        return False

@celery_app.task(name="system.scheduler_recovery")
def task_scheduler_recovery():
    """
    Scans for missed automation windows and re-aligns the ingestion grid.
    Fixes the 'Imprecise Task Recovery' audit finding.
    """
    async def _scan():
        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            query = select(ScheduledParserJob).filter(
                ScheduledParserJob.is_active == True,
                ScheduledParserJob.next_run_at <= now
            )
            result = await db.execute(query)
            missed_jobs = result.scalars().all()
            
            for job in missed_jobs:
                logger.warning("Scheduler: Recovery triggered for missed node", node=job.parser_name, scheduled=job.next_run_at)
                
                if job.parser_name == "shikimori":
                    if job.job_type == "full_sync": run_full_sync_task.delay(str(job.id))
                    else: run_incremental_sync_task.delay(str(job.id))
                elif job.parser_name == "kodik":
                    from app.tasks.parsers import run_release_updates_task
                    run_release_updates_task.delay(str(job.id))
                
                job.last_run_at = now
                
                # Intelligent Window Re-alignment
                if "*/30" in job.cron_expression:
                    job.next_run_at = now + timedelta(minutes=30)
                elif "0 0" in job.cron_expression:
                    job.next_run_at = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0)
                else:
                    # Default: 1 hour safety advance to prevent sync loops
                    job.next_run_at = now + timedelta(hours=1)
                
                db.add(job)
            
            await db.commit()
                
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(_scan())
    except Exception as e:
        logger.error("Scheduler: Recovery pulse failed", error=str(e))
