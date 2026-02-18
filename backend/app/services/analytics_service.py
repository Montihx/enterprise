from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, desc
from datetime import datetime, timedelta, timezone
from app.models.anime import Anime
from app.models.user import User
from app.models.interaction import WatchProgress, Favorite
from app.models.release import Release

class AnalyticsService:
    async def get_overview_metrics(self, db: AsyncSession) -> Dict[str, Any]:
        """Compute top-level KPI metrics with growth deltas using real database state."""
        now = datetime.now(timezone.utc)
        last_month = now - timedelta(days=30)

        # 1. Audience Total & Growth
        u_total = (await db.execute(select(func.count(User.id)))).scalar() or 0
        u_prev = (await db.execute(select(func.count(User.id)).filter(User.created_at < last_month))).scalar() or 1
        u_trend = round(((u_total - u_prev) / u_prev) * 100, 1)

        # 2. Content Nodes (Anime)
        anime_total = (await db.execute(select(func.count(Anime.id)))).scalar() or 0
        anime_prev = (await db.execute(select(func.count(Anime.id)).filter(Anime.created_at < last_month))).scalar() or 1
        anime_trend = round(((anime_total - anime_prev) / anime_prev) * 100, 1)

        # 3. Engagement: Total Distributed Streams (Releases)
        releases_total = (await db.execute(select(func.count(Release.id)))).scalar() or 0
        releases_prev = (await db.execute(select(func.count(Release.id)).filter(Release.created_at < last_month))).scalar() or 1
        releases_trend = round(((releases_total - releases_prev) / releases_prev) * 100, 1)

        return {
            "audience": {"value": u_total, "trend": u_trend, "isPositive": u_trend >= 0},
            "catalog": {"value": anime_total, "trend": anime_trend, "isPositive": anime_trend >= 0},
            "assets": {"value": releases_total, "trend": releases_trend, "isPositive": releases_trend >= 0},
            "uptime": None  # Track via Prometheus/Sentry, not hardcoded # Mocked as uptime depends on external monitoring (Sentry/Datadog)
        }


    def _get_uptime(self) -> str:
        """Returns real server uptime since process start."""
        import psutil, os
        try:
            proc = psutil.Process(os.getpid())
            start = proc.create_time()
            uptime_seconds = (datetime.now().timestamp() - start)
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            if days > 0:
                return f"{days}d {hours}h {minutes}m"
            elif hours > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{minutes}m"
        except Exception:
            return "N/A"

    async def get_popular_content(self, db: AsyncSession, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch content nodes with highest interaction counts."""
        query = (
            select(Anime.title, Anime.views_count, Anime.score)
            .order_by(desc(Anime.views_count))
            .limit(limit)
        )
        result = await db.execute(query)
        return [{"title": row[0], "views": row[1], "score": float(row[2])} for row in result.all()]

    async def get_genre_distribution(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Compute distribution of genres across the entire registry using JSONB expansion."""
        # PostgreSQL JSONB array elements expansion
        query = (
            select(func.jsonb_array_elements_text(Anime.genres), func.count())
            .group_by(1)
            .order_by(desc(func.count()))
            .limit(8)
        )
        result = await db.execute(query)
        return [{"name": row[0], "value": row[1]} for row in result.all()]

analytics_service = AnalyticsService()