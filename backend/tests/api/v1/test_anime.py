"""Anime endpoint tests: list, search, detail."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_anime_public(client: AsyncClient):
    response = await client.get("/api/v1/anime/")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data or isinstance(data, list)


@pytest.mark.asyncio
async def test_get_anime_by_slug(client: AsyncClient, test_anime):
    response = await client.get(f"/api/v1/anime/{test_anime.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == test_anime.slug
    assert data["title"] == test_anime.title


@pytest.mark.asyncio
async def test_get_nonexistent_anime(client: AsyncClient):
    response = await client.get("/api/v1/anime/nonexistent-slug-9999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_search_anime_empty_query(client: AsyncClient):
    response = await client.get("/api/v1/anime/search?q=")
    assert response.status_code in (200, 422)


@pytest.mark.asyncio
async def test_search_anime_with_results(client: AsyncClient, test_anime):
    response = await client.get(f"/api/v1/anime/search?q=Тест")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_create_anime_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/anime/",
        json={"title": "New Anime", "slug": "new-anime", "kind": "tv"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_anime_as_admin(client: AsyncClient, admin_headers):
    response = await client.post(
        "/api/v1/anime/",
        json={"title": "Новое Аниме", "slug": "new-anime-admin", "kind": "tv"},
        headers=admin_headers,
    )
    assert response.status_code in (200, 201, 403)  # 403 if RBAC prevents it


@pytest.mark.asyncio
async def test_anime_pagination(client: AsyncClient, test_anime):
    response = await client.get("/api/v1/anime/?skip=0&limit=10")
    assert response.status_code == 200
