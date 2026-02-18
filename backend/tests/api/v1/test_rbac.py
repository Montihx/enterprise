"""RBAC tests: permission enforcement for admin endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_regular_user_cannot_access_users_list(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/users/", headers=auth_headers)
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_superuser_can_access_users_list(client: AsyncClient, admin_headers):
    response = await client.get("/api/v1/users/", headers=admin_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_moderation_requires_permission(client: AsyncClient, auth_headers):
    response = await client.get(
        "/api/v1/interactions/comments/staff-queue",
        headers=auth_headers,
    )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_unauthenticated_cannot_access_protected(client: AsyncClient):
    endpoints = [
        "/api/v1/users/me",
        "/api/v1/interactions/favorites",
        "/api/v1/interactions/watch-progress/continue",
        "/api/v1/interactions/collections",
    ]
    for endpoint in endpoints:
        resp = await client.get(endpoint)
        assert resp.status_code == 401, f"Expected 401 for {endpoint}, got {resp.status_code}"


@pytest.mark.asyncio
async def test_invalid_token_rejected(client: AsyncClient):
    headers = {"Authorization": "Bearer invalidtoken"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
