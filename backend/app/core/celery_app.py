from celery import Celery
from celery.schedules import crontab
import json
from redis.asyncio import Redis
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=str(settings.REDIS_URL),
    backend=str(settings.REDIS_URL)
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
    # Periodic Tasks Schedule
    beat_schedule={
        "daily-backup-at-midnight": {
            "task": "system.automated_daily_backup",
            "schedule": crontab(hour=0, minute=0),
        },
        "ongoing-releases-sync": {
            "task": "parsers.run_release_updates",
            "schedule": crontab(minute="*/30"), # Every 30 mins
        },
        "scheduler-recovery-pulse": {
            "task": "system.scheduler_recovery",
            "schedule": crontab(minute="*/15"), # Check every 15 mins for missed windows
        },
    }
)

celery_app.autodiscover_tasks(["app.tasks"])

async def publish_job_progress(job_id: str, progress: int, stats: dict):
    """
    Broadcasts job updates to the WebSocket hub via Redis Pub/Sub.
    Reuses the app-level cache connection instead of creating a new one each call.
    """
    from app.core.cache import cache
    payload = {
        "job_id": job_id,
        "progress": progress,
        "stats": stats
    }
    if cache.redis:
        await cache.redis.publish(f"job_progress:{job_id}", json.dumps(payload))
    else:
        # Fallback: create short-lived connection only if cache not initialized
        _redis = Redis.from_url(str(settings.REDIS_URL))
        await _redis.publish(f"job_progress:{job_id}", json.dumps(payload))
        await _redis.close()
