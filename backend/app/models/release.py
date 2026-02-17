
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class Release(Base):
    __tablename__ = "releases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Source
    source: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # 'kodik', 'aniboom'
    external_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    
    # Quality
    quality: Mapped[Optional[str]] = mapped_column(String(50), index=True) # '1080p', '720p'
    
    # Translation
    translation_type: Mapped[Optional[str]] = mapped_column(String(50)) # 'voice', 'subtitles'
    translation_team: Mapped[Optional[str]] = mapped_column(String(255))
    translation_language: Mapped[str] = mapped_column(String(10), default='ru')
    
    # URLs
    url: Mapped[str] = mapped_column(Text, nullable=False)
    embed_url: Mapped[Optional[str]] = mapped_column(Text)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Metadata
    metadata_info: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    episode = relationship("Episode", back_populates="releases")
