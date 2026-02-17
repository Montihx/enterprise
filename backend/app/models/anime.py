
import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Integer, Text, Date, DateTime, Numeric, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
from app.models.base import Base

class Anime(Base):
    __tablename__ = "anime"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Provider Junctions
    shikimori_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, nullable=True, index=True)
    mal_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    kodik_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    
    # Metadata & SEO
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    title_en: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title_jp: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title_romaji: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    synonyms: Mapped[List[str]] = mapped_column(JSONB, default=list)
    
    # Biological Data
    kind: Mapped[Optional[str]] = mapped_column(String(50), index=True) 
    status: Mapped[Optional[str]] = mapped_column(String(50), index=True) 
    rating: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    
    # Capacity
    episodes_total: Mapped[Optional[int]] = mapped_column(Integer)
    episodes_aired: Mapped[int] = mapped_column(Integer, default=0)
    
    # Visual Assets
    poster_url: Mapped[Optional[str]] = mapped_column(Text)
    cover_url: Mapped[Optional[str]] = mapped_column(Text)
    screenshots: Mapped[List[str]] = mapped_column(JSONB, default=list)
    
    # Temporal Data
    aired_on: Mapped[Optional[date]] = mapped_column(Date, index=True)
    released_on: Mapped[Optional[date]] = mapped_column(Date)
    next_episode_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Core Data
    description: Mapped[Optional[str]] = mapped_column(Text)
    score: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), index=True)
    score_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Taxonomy
    genres: Mapped[List[str]] = mapped_column(JSONB, default=list)
    studios: Mapped[List[str]] = mapped_column(JSONB, default=list)
    franchises: Mapped[List[dict]] = mapped_column(JSONB, default=list)
    related: Mapped[List[dict]] = mapped_column(JSONB, default=list)
    
    # Audit & Tracking
    views_count: Mapped[int] = mapped_column(Integer, default=0, index=True)
    favorites_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Distributed Search
    search_vector: Mapped[Optional[TSVECTOR]] = mapped_column(TSVECTOR)
    
    # Temporal Stamping
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Invariants
    episodes = relationship("Episode", back_populates="anime", cascade="all, delete-orphan", lazy="selectin")

    # Indices
    __table_args__ = (
        Index('ix_anime_search_vector', 'search_vector', postgresql_using='gin'),
        Index('ix_anime_genres_gin', 'genres', postgresql_using='gin'),
    )

    @property
    def year(self) -> Optional[int]:
        return self.aired_on.year if self.aired_on else None
