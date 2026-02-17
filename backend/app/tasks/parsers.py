import asyncio
from app.core.celery_app import celery_app
from app.core.logging import logger
from app.db.session import AsyncSessionLocal
from app.services.parsers.shikimori import ShikimoriParserService
from app.services.parsers.kodik import KodikParserService
from app.crud.crud_parser import parser_settings, parser_job

@celery_app.task(name="parsers.run_full_sync")
def run_full_sync_task(job_id: str):
    logger.info(f"Worker_Alpha: Initiating Deep Sync Lifecycle for Job {job_id}")
    asyncio.run(_execute_sync(job_id, "full"))

@celery_app.task(name="parsers.run_incremental_sync")
def run_incremental_sync_task(job_id: str):
    logger.info(f"Worker_Alpha: Initiating Pulse Ingestion for Job {job_id}")
    asyncio.run(_execute_sync(job_id, "incremental"))

@celery_app.task(name="parsers.run_release_updates")
def run_release_updates_task(job_id: str = None):
    logger.info(f"Worker_Beta: Scanning CDN clusters for release updates")
    asyncio.run(_execute_releases(job_id))

async def _execute_sync(job_id: str, mode: str):
    async with AsyncSessionLocal() as db:
        try:
            # Aggregating configurations from all registry nodes
            grab = await parser_settings.get_by_category(db, category="grabbing")
            gen = await parser_settings.get_by_category(db, category="general")
            tpl = await parser_settings.get_by_category(db, category="fields")
            img = await parser_settings.get_by_category(db, category="images")
            
            config = {
                **(grab.config if grab else {}),
                **(gen.config if gen else {}),
                **(tpl.config if tpl else {}),
                **(img.config if img else {})
            }
            
            service = ShikimoriParserService(proxy_config=gen.config if gen else None)
            await service.run_sync_task(db, job_id, config, mode=mode)
            await service.close()
            
        except Exception as e:
            logger.exception(f"Ingestion_Fault: Fatal interrupt in job {job_id}", error=str(e))
            job = await parser_job.get(db, id=job_id)
            if job:
                await parser_job.update(db, db_obj=job, obj_in={"status": "failed", "error_message": str(e)})

async def _execute_releases(job_id: str):
    async with AsyncSessionLocal() as db:
        gen = await parser_settings.get_by_category(db, category="general")
        service = KodikParserService(proxy_config=gen.config if gen else None)
        try:
            await service.sync_ongoing_releases(db, job_id)
        except Exception as e:
            logger.error(f"Worker_Beta: Release Pulse Fault", error=str(e))
        finally:
            await service.close()
