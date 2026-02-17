
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field

# Shared properties
class AnimeBase(BaseModel):
    title: str
    slug: str
    kind: Optional[str] = None
    status: Optional[str] = None
    score: Optional[float] = None
    episodes_total: Optional[int] = None
    poster_url: Optional[str] = None
    year: Optional[int] = None # Calculated from aired_on
    genres: List[str] = []

# Properties to receive on creation
class AnimeCreate(AnimeBase):
    title_en: Optional[str] = None
    title_jp: Optional[str] = None
    description: Optional[str] = None
    shikimori_id: Optional[int] = None
    kodik_id: Optional[str] = None
    aired_on: Optional[date] = None

# Properties to receive on update
class AnimeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    score: Optional[float] = None
    episodes_aired: Optional[int] = None
    status: Optional[str] = None

# Properties to return to client
class Anime(AnimeBase):
    id: UUID
    title_en: Optional[str] = None
    description: Optional[str] = None
    studios: List[str] = []
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AnimeSearchResults(BaseModel):
    results: List[Anime]
    total: int
