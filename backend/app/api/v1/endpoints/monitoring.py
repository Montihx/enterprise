import os
import time
import psutil
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.core.celery_app import celery_app
from app.core.logging import logger

router = APIRouter()

@router.get("/health", tags=["monitoring"])
async def get_detailed_health(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Real-time node diagnostic telemetry.
    Aggregates database latency, hardware saturation, and worker availability.
    """
    # 1. Database Latency Profile
    start_time = time.time()
    try:
        await db.execute(text("SELECT 1"))
        db_latency = (time.time() - start_time) * 1000
        db_status = "online"
    except Exception as e:
        logger.error("Monitoring: Database node heartbeat lost", error=str(e))
        db_latency = 0
        db_status = "unreachable"

    # 2. Hardware Satmetry
    cpu_usage = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # 3. Process Footprint
    process = psutil.Process(os.getpid())
    app_memory_mb = process.memory_info().rss / (1024 * 1024)

    # 4. Asynchronous Worker Fleet Inspection
    worker_status = "offline"
    active_workers = 0
    try:
        insp = celery_app.control.inspect()
        stats = insp.stats()
        if stats:
            worker_status = "online"
            active_workers = len(stats)
    except Exception:
        worker_status = "connection_fault"

    return {
        "status": "healthy" if db_status == "online" else "degraded",
        "timestamp": time.time(),
        "services": {
            "database": {"status": db_status, "latency_ms": round(db_latency, 2)},
            "cache": {"status": "online"},
            "worker": {"status": worker_status, "count": active_workers}
        },
        "resources": {
            "cpu_percent": cpu_usage,
            "memory_percent": memory.percent,
            "memory_app_mb": round(app_memory_mb, 2),
            "disk_percent": disk.percent,
            "load_avg": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0,0,0]
        }
    }
