from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.crud.crud_parser import parser_settings
from app.core.logging import logger

class TaxonomyReconciliationService:
    """
    Orchestrates the mapping of external genres to internal site categories.
    Direct port of the DLE 'Categories' tab logic.
    """
    async def get_mapping(self, db: AsyncSession) -> Dict[str, str]:
        settings = await parser_settings.get_by_category(db, "categories")
        if not settings or 'mappings' not in settings.config:
            return {}
        return settings.config['mappings']

    async def reconcile_genres(self, db: AsyncSession, external_genres: List[str]) -> List[str]:
        """Maps external strings like 'Экшен' to internal taxonomy IDs or slugs."""
        mapping = await self.get_mapping(db)
        reconciled = []
        
        for genre in external_genres:
            # Check for direct mapping
            if genre in mapping:
                reconciled.append(mapping[genre])
            else:
                # Default to the genre name itself if no mapping node exists
                reconciled.append(genre)
        
        return list(set(reconciled))

taxonomy_service = TaxonomyReconciliationService()
