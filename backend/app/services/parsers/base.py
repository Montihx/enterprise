
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseParserService(ABC):
    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for content in the external provider."""
        pass

    @abstractmethod
    async def get_full_data(self, external_id: str) -> Dict[str, Any]:
        """Fetch detailed data for a specific item."""
        pass
