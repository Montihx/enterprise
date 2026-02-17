
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, HttpUrl

class ReleaseBase(BaseModel):
    source: str  # 'kodik', 'aniboom', etc.
    external_id: Optional[str] = None
    quality: Optional[str] = None  # '1080p', '720p'
    translation_type: Optional[str] = None  # 'voice', 'subtitles'
    translation_team: Optional[str] = None
    translation_language: str = 'ru'
    url: str
    embed_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False

class ReleaseCreate(ReleaseBase):
    episode_id: UUID

class ReleaseUpdate(BaseModel):
    source: Optional[str] = None
    external_id: Optional[str] = None
    quality: Optional[str] = None
    translation_type: Optional[str] = None
    translation_team: Optional[str] = None
    translation_language: Optional[str] = None
    url: Optional[str] = None
    embed_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class Release(ReleaseBase):
    id: UUID
    episode_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
