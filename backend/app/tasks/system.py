"""
Celery tasks for system-level operations.

Tasks:
  - system.automated_daily_backup: Creates a compressed DB snapshot and records it.
  - system.scheduler_recovery: Scans for missed scheduled parser jobs and triggers them.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.future import select
from app.core.celery_app import celery_app
from app.core.logging import logger
from app.services.backup_service import backup_service
from app.db.session import AsyncSessionLocal
from app.models.parser import ScheduledParserJob
from app.tasks.parsers import run_full_sync_task, run_incremental_sync_task

try:
    from croniter import croniter
    HAS_CRONITER = True
except ImportError:
    HAS_CRONITER = False


def _next_run_from_cron(cron_expr: str, base: datetime) -> datetime:
    """Parse cron expression using croniter if available, else simple fallback."""
    if HAS_CRONITER:
        try:
            cron = croniter(cron_expr, base)
            return cron.get_next(datetime)
        except Exception:
            pass

    # Simple fallback for common patterns
    if "*/30" in cron_expr:
        return base + timedelta(minutes=30)
    if "*/15" in cron_expr:
        return base + timedelta(minutes=15)
    if "*/60" in cron_expr or "0 * * * *" in cron_expr:
        return base + timedelta(hours=1)
    if "0 0" in cron_expr and "* * *" in cron_expr:
        return (base + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    # Default: 1 hour
    return base + timedelta(hours=1)


@celery_app.task(name="system.automated_daily_backup")
def task_automated_backup():
    """Run automated backup and record it in the database.

    Uses the BackupService to create a pg_dump snapshot, then persists
    a Backup record so it appears in the Dashboard backups list.
    Returns True on success, False on failure.
    """
    logger.info("Automated backup: starting daily snapshot")

    async def _run():
        async with AsyncSessionLocal() as db:
            try:
                result = await backup_service.create_backup(created_by_id=None)

                # FIX: Backup model fields are:
                #   filename, type (NOT NULL), size_bytes (NOT NULL),
                #   storage_path (NOT NULL), status, created_by (UUID FK, nullable)
                # The original code incorrectly used 'created_by_id' and omitted required fields.
                from app.models.system import Backup
                backup_record = Backup(
                    filename=result.get("filename", "unknown"),
                    type="automatic",                                    # FIX: required field
                    size_bytes=result.get("size_bytes", 0),
                    storage_path=result.get("storage_path", "/app/backups/unknown"),  # FIX: required field
                    status="completed",
                    created_by=None,  # FIX: correct field name (not created_by_id)
                )
                db.add(backup_record)
                await db.commit()

                logger.info(
                    "Automated backup: completed",
                    filename=result.get("filename"),
                    size_bytes=result.get("size_bytes"),
                )
                return True
            except Exception as e:
                logger.error("Automated backup: failed", error=str(e))
                # Record failed backup attempt so the Dashboard shows a failure entry
                try:
                    from app.models.system import Backup
                    backup_record = Backup(
                        filename="failed",
                        type="automatic",
                        size_bytes=0,
                        storage_path="/app/backups/failed",
                        status="failed",
                        created_by=None,
                    )
                    db.add(backup_record)
                    await db.commit()
                except Exception:
                    pass
                return False

    try:
        return asyncio.run(_run())
    except Exception as e:
        logger.error("Automated backup: task crash", error=str(e))
        return False


@celery_app.task(name="system.scheduler_recovery")
def task_scheduler_recovery():
    """Scan for missed scheduled parser jobs and trigger them.

    Queries ScheduledParserJob for active jobs whose next_run_at is in the past,
    dispatches the appropriate Celery task, and updates the schedule timestamps.
    """

    async def _scan():
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            query = select(ScheduledParserJob).filter(
                ScheduledParserJob.is_active == True,
                ScheduledParserJob.next_run_at <= now,
            )
            result = await db.execute(query)
            missed_jobs = result.scalars().all()

            for job in missed_jobs:
                logger.warning(
                    "Scheduler recovery: triggering missed job",
                    parser=job.parser_name,
                    job_type=job.job_type,
                    scheduled_at=job.next_run_at,
                )

                if job.parser_name == "shikimori":
                    if job.job_type == "full_sync":
                        run_full_sync_task.delay(str(job.id))
                    else:
                        run_incremental_sync_task.delay(str(job.id))
                elif job.parser_name == "kodik":
                    from app.tasks.parsers import run_release_updates_task
                    run_release_updates_task.delay(str(job.id))

                job.last_run_at = now
                job.next_run_at = _next_run_from_cron(job.cron_expression, now)
                db.add(job)

            await db.commit()
            logger.info("Scheduler recovery: complete", jobs_recovered=len(missed_jobs))

    try:
        asyncio.run(_scan())
    except Exception as e:
        logger.error("Scheduler recovery: failed", error=str(e))
