
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_anime_list(client: AsyncClient):
    response = await client.get("/api/v1/anime/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_get_anime_by_slug_not_found(client: AsyncClient):
    response = await client.get("/api/v1/anime/non-existent-anime-12345")
    assert response.status_code == 404
