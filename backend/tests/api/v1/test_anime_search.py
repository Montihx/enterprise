"""Anime search and catalog endpoint tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_anime_catalog_returns_list(client: AsyncClient):
    response = await client.get("/api/v1/anime/")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data or isinstance(data, list)


@pytest.mark.asyncio
async def test_anime_search_by_query(client: AsyncClient, test_anime):
    response = await client.get("/api/v1/anime/search", params={"q": "Тест"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_anime_search_empty_query(client: AsyncClient):
    response = await client.get("/api/v1/anime/search", params={"q": ""})
    assert response.status_code in (200, 422)


@pytest.mark.asyncio
async def test_get_anime_by_slug(client: AsyncClient, test_anime):
    response = await client.get(f"/api/v1/anime/{test_anime.slug}")
    assert response.status_code == 200
    assert response.json()["slug"] == test_anime.slug


@pytest.mark.asyncio
async def test_get_nonexistent_anime(client: AsyncClient):
    response = await client.get("/api/v1/anime/nonexistent-slug-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_anime_pagination(client: AsyncClient):
    response = await client.get("/api/v1/anime/", params={"skip": 0, "limit": 5})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_anime_filter_by_status(client: AsyncClient):
    response = await client.get("/api/v1/anime/", params={"status": "ongoing"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_anime_filter_by_kind(client: AsyncClient):
    response = await client.get("/api/v1/anime/", params={"kind": "tv"})
    assert response.status_code == 200
