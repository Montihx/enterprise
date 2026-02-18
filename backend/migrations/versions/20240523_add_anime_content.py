
"""add_anime_content

Revision ID: 20240523_anime
Revises: 20240523_init
Create Date: 2024-05-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20240523_anime'
down_revision = '20240523_init'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # ### Anime Table ###
    op.create_table('anime',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('shikimori_id', sa.Integer(), nullable=True),
        sa.Column('mal_id', sa.Integer(), nullable=True),
        sa.Column('kodik_id', sa.String(length=255), nullable=True),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('title_en', sa.String(length=500), nullable=True),
        sa.Column('title_jp', sa.String(length=500), nullable=True),
        sa.Column('title_romaji', sa.String(length=500), nullable=True),
        sa.Column('synonyms', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('kind', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('rating', sa.String(length=20), nullable=True),
        sa.Column('episodes_total', sa.Integer(), nullable=True),
        sa.Column('episodes_aired', sa.Integer(), nullable=False),
        sa.Column('poster_url', sa.Text(), nullable=True),
        sa.Column('cover_url', sa.Text(), nullable=True),
        sa.Column('screenshots', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('aired_on', sa.Date(), nullable=True),
        sa.Column('released_on', sa.Date(), nullable=True),
        sa.Column('next_episode_at', sa.DateTime(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('description_source', sa.Text(), nullable=True),
        sa.Column('score', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('score_count', sa.Integer(), nullable=False),
        sa.Column('genres', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('themes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('studios', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('franchises', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('related', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('views_count', sa.Integer(), nullable=False),
        sa.Column('favorites_count', sa.Integer(), nullable=False),
        sa.Column('search_vector', postgresql.TSVECTOR(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('shikimori_id')
    )
    op.create_index(op.f('ix_anime_slug'), 'anime', ['slug'], unique=True)
    op.create_index(op.f('ix_anime_kind'), 'anime', ['kind'], unique=False)
    op.create_index(op.f('ix_anime_status'), 'anime', ['status'], unique=False)
    op.create_index(op.f('ix_anime_score'), 'anime', ['score'], unique=False)
    op.create_index(op.f('ix_anime_aired_on'), 'anime', ['aired_on'], unique=False)
    op.create_index('ix_anime_search_vector', 'anime', ['search_vector'], unique=False, postgresql_using='gin')

    # ### Episodes Table ###
    op.create_table('episodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('anime_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('season', sa.Integer(), nullable=False),
        sa.Column('episode', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=True),
        sa.Column('title_en', sa.String(length=500), nullable=True),
        sa.Column('thumbnail_url', sa.Text(), nullable=True),
        sa.Column('aired_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('is_filler', sa.Boolean(), nullable=False),
        sa.Column('is_recap', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['anime_id'], ['anime.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('anime_id', 'season', 'episode', name='uq_anime_season_episode')
    )
    op.create_index(op.f('ix_episodes_anime_id'), 'episodes', ['anime_id'], unique=False)
    
    # ### Releases Table ###
    op.create_table('releases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('episode_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source', sa.String(length=100), nullable=False),
        sa.Column('external_id', sa.String(length=255), nullable=True),
        sa.Column('quality', sa.String(length=50), nullable=True),
        sa.Column('translation_type', sa.String(length=50), nullable=True),
        sa.Column('translation_team', sa.String(length=255), nullable=True),
        sa.Column('translation_language', sa.String(length=10), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('embed_url', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['episode_id'], ['episodes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_releases_episode_id'), 'releases', ['episode_id'], unique=False)

    # ### Full Text Search Trigger ###
    op.execute("""
        CREATE FUNCTION anime_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.title, '')), 'A') ||
                setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.title_en, '')), 'B') ||
                setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.description, '')), 'C');
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
        CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
        ON anime FOR EACH ROW EXECUTE FUNCTION anime_search_vector_update();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS tsvectorupdate ON anime")
    op.execute("DROP FUNCTION IF EXISTS anime_search_vector_update")
    op.drop_table('releases')
    op.drop_table('episodes')
    op.drop_table('anime')
