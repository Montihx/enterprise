from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.system import SiteSetting
from app.core.cache import cache

class SiteSettingsService:
    async def get_all_settings(self, db: AsyncSession, public_only: bool = False) -> Dict[str, Any]:
        """Fetch all settings from the database and cache."""
        cache_key = f"site_settings:{'public' if public_only else 'all'}"
        cached_val = await cache.get(cache_key)
        if cached_val:
            return cached_val

        query = select(SiteSetting)
        if public_only:
            query = query.filter(SiteSetting.is_public == True)
        
        result = await db.execute(query)
        settings_map = {s.key: s.value for s in result.scalars().all()}
        
        await cache.set(cache_key, settings_map, expire=600)
        return settings_map

    async def update_settings(self, db: AsyncSession, updates: Dict[str, Any]) -> None:
        """Apply batch updates to site settings and invalidate cache."""
        for key, value in updates.items():
            result = await db.execute(select(SiteSetting).filter(SiteSetting.key == key))
            setting = result.scalars().first()
            if setting:
                setting.value = value
                db.add(setting)
        
        await db.commit()
        await cache.clear_prefix("site_settings")

site_settings_service = SiteSettingsService()
