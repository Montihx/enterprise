"""User endpoint tests: profile read, update, avatar."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@kitsu.io"
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_user_bio(client: AsyncClient, auth_headers):
    response = await client.put(
        "/api/v1/users/me",
        json={"bio": "Люблю аниме!"},
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_user_avatar(client: AsyncClient, auth_headers):
    avatar_url = "https://api.dicebear.com/7.x/avataaars/svg?seed=test"
    response = await client.put(
        "/api/v1/users/me",
        json={"avatar_url": avatar_url},
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_list_users_requires_superuser(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/users/", headers=auth_headers)
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_list_users_as_superuser(client: AsyncClient, admin_headers):
    response = await client.get("/api/v1/users/", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
