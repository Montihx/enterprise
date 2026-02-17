from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, desc
from datetime import datetime, timedelta
from app.api import deps
from app.models.parser import ParserJob
from app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/stats/overview", tags=["dashboard"])
async def get_stats_overview(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """Retrieve comprehensive system KPI overview from real database state."""
    return await analytics_service.get_overview_metrics(db)

@router.get("/stats/popular", tags=["dashboard"])
async def get_popular_content(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """Fetch top-performing content nodes."""
    return await analytics_service.get_popular_content(db)

@router.get("/stats/genres", tags=["dashboard"])
async def get_genre_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """Aggregate taxonomy distribution."""
    return await analytics_service.get_genre_distribution(db)

@router.get("/stats/charts", tags=["dashboard"])
async def get_chart_data(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_superuser)
) -> Any:
    """Aggregates last 7 days of ingestion throughput for the dashboard chart."""
    days = []
    for i in range(6, -1, -1):
        target_date = (datetime.utcnow() - timedelta(days=i)).date()
        
        # Shikimori Sync Volume
        s_query = select(func.sum(ParserJob.items_processed)).filter(
            func.date(ParserJob.created_at) == target_date,
            ParserJob.parser_name == 'shikimori'
        )
        s_res = await db.execute(s_query)
        
        # Kodik Sync Volume
        k_query = select(func.sum(ParserJob.items_processed)).filter(
            func.date(ParserJob.created_at) == target_date,
            ParserJob.parser_name == 'kodik'
        )
        k_res = await db.execute(k_query)
        
        days.append({
            "name": target_date.strftime("%a"),
            "shikimori": s_res.scalar() or 0,
            "kodik": k_res.scalar() or 0
        })
        
    return days