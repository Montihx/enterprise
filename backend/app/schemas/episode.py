
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class EpisodeBase(BaseModel):
    season: int = 1
    episode: int
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    aired_at: Optional[datetime] = None
    is_filler: bool = False
    is_recap: bool = False

class EpisodeCreate(EpisodeBase):
    anime_id: UUID

class EpisodeUpdate(BaseModel):
    season: Optional[int] = None
    episode: Optional[int] = None
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    aired_at: Optional[datetime] = None
    is_filler: Optional[bool] = None
    is_recap: Optional[bool] = None

class Episode(EpisodeBase):
    id: UUID
    anime_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
