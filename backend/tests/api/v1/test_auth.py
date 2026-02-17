
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "password123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_login_access_token(client: AsyncClient):
    # Ensure user exists
    await client.post(
        "/api/v1/register",
        json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "password123",
        }
    )

    login_data = {
        "username": "login@example.com",
        "password": "password123",
    }
    response = await client.post("/api/v1/login/access-token", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    # Register and Login
    await client.post(
        "/api/v1/register",
        json={
            "email": "refresh@example.com",
            "username": "refreshuser",
            "password": "password123",
        }
    )
    login_res = await client.post("/api/v1/login/access-token", data={"username": "refresh@example.com", "password": "password123"})
    refresh_token = login_res.json()["refresh_token"]
    
    # Refresh
    response = await client.post("/api/v1/refresh-token", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    new_tokens = response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["access_token"] != login_res.json()["access_token"]
