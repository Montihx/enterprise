
import pytest
from httpx import AsyncClient
from app.crud.crud_anime import anime as crud_anime
from app.schemas.anime import AnimeCreate

# Helper to create an anime first
async def create_test_anime(db, title="Test Anime"):
    return await crud_anime.create(db, obj_in=AnimeCreate(title=title, slug=title.lower().replace(" ", "-")))

@pytest.mark.asyncio
async def test_create_episode(client: AsyncClient, db_session):
    anime = await create_test_anime(db_session)
    response = await client.post(
        "/api/v1/episodes/",
        json={
            "anime_id": str(anime.id),
            "season": 1,
            "episode": 1,
            "title": "Pilot"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["episode"] == 1
    assert data["title"] == "Pilot"

@pytest.mark.asyncio
async def test_read_episodes(client: AsyncClient):
    response = await client.get("/api/v1/episodes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
