"""Favorites and watch list endpoint tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_add_to_favorites(client: AsyncClient, auth_headers, test_anime):
    response = await client.post(
        f"/api/v1/favorites/{test_anime.id}",
        headers=auth_headers,
        json={"category": "watching"}
    )
    assert response.status_code in (200, 201)


@pytest.mark.asyncio
async def test_add_favorite_unauthenticated(client: AsyncClient, test_anime):
    response = await client.post(
        f"/api/v1/favorites/{test_anime.id}",
        json={"category": "watching"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_my_favorites(client: AsyncClient, auth_headers, test_anime):
    # First add
    await client.post(
        f"/api/v1/favorites/{test_anime.id}",
        headers=auth_headers,
        json={"category": "watching"}
    )
    # Then get
    response = await client.get("/api/v1/favorites/", headers=auth_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_invalid_favorite_category(client: AsyncClient, auth_headers, test_anime):
    response = await client.post(
        f"/api/v1/favorites/{test_anime.id}",
        headers=auth_headers,
        json={"category": "invalid_category_xyz"}
    )
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_remove_from_favorites(client: AsyncClient, auth_headers, test_anime):
    # Add first
    await client.post(
        f"/api/v1/favorites/{test_anime.id}",
        headers=auth_headers,
        json={"category": "watching"}
    )
    # Remove
    response = await client.delete(
        f"/api/v1/favorites/{test_anime.id}",
        headers=auth_headers
    )
    assert response.status_code in (200, 204)
