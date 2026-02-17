
import pytest
from httpx import AsyncClient
from app.crud.crud_anime import anime as crud_anime
from app.crud.crud_episode import episode as crud_episode
from app.schemas.anime import AnimeCreate
from app.schemas.episode import EpisodeCreate

# Helpers
async def create_test_anime(db, title="Test Anime Release"):
    return await crud_anime.create(db, obj_in=AnimeCreate(title=title, slug=title.lower().replace(" ", "-")))

async def create_test_episode(db, anime_id):
    return await crud_episode.create(db, obj_in=EpisodeCreate(anime_id=anime_id, season=1, episode=1, title="Ep 1"))

@pytest.mark.asyncio
async def test_create_release(client: AsyncClient, db_session):
    anime = await create_test_anime(db_session)
    episode = await create_test_episode(db_session, anime.id)
    
    response = await client.post(
        "/api/v1/releases/",
        json={
            "episode_id": str(episode.id),
            "source": "kodik",
            "quality": "1080p",
            "translation_type": "voice",
            "translation_team": "Test Team",
            "url": "https://example.com/video.mp4"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["source"] == "kodik"
    assert data["translation_team"] == "Test Team"

@pytest.mark.asyncio
async def test_read_releases(client: AsyncClient):
    response = await client.get("/api/v1/releases/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
