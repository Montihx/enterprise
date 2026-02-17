from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# --- Comments ---
class CommentBase(BaseModel):
    content: str
    anime_id: Optional[UUID] = None
    episode_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: Optional[str] = None
    is_hidden: Optional[bool] = None

class Comment(CommentBase):
    id: UUID
    user_id: UUID
    user: Optional[Any] = None # Simplified for now, in real impl would use User schema
    likes_count: int
    replies_count: int
    is_hidden: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Favorites ---
class FavoriteBase(BaseModel):
    anime_id: UUID
    category: str = 'watching' # watching, completed, planned, dropped, on_hold

class FavoriteCreate(FavoriteBase):
    pass

class Favorite(FavoriteBase):
    id: UUID
    user_id: UUID
    user_score: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Watch Progress ---
class WatchProgressBase(BaseModel):
    episode_id: UUID
    position_seconds: int
    total_seconds: int

class WatchProgressCreate(WatchProgressBase):
    pass

class WatchProgress(WatchProgressBase):
    id: UUID
    user_id: UUID
    percentage: float
    completed: bool
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Collections ---
class CollectionBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    is_public: bool = False

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class Collection(CollectionBase):
    id: UUID
    user_id: UUID
    items_count: int
    views_count: int
    likes_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CollectionItemCreate(BaseModel):
    anime_id: UUID
    notes: Optional[str] = None
