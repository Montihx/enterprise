import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_read_anime_list_structure(client: AsyncClient):
    response = await client.get("/api/v1/anime/")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "meta" in data
    assert isinstance(data["data"], list)
    assert data["meta"]["page"] == 1

@pytest.mark.asyncio
async def test_anime_search_empty_paginated(client: AsyncClient):
    response = await client.get("/api/v1/anime/?q=MissingLink")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []
    assert data["meta"]["total"] == 0
