
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anime_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("anime.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Episode Info
    season: Mapped[int] = mapped_column(Integer, default=1)
    episode: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Titles
    title: Mapped[Optional[str]] = mapped_column(String(500))
    title_en: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Visual
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text)
    
    # Metadata
    aired_at: Mapped[Optional[datetime]] = mapped_column(DateTime, index=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    is_filler: Mapped[bool] = mapped_column(Boolean, default=False)
    is_recap: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    anime = relationship("Anime", back_populates="episodes")
    releases = relationship("Release", back_populates="episode", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('anime_id', 'season', 'episode', name='uq_anime_season_episode'),
    )
