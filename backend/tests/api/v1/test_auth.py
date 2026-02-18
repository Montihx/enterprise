"""Auth endpoint tests: login, register, token refresh, email verification, password reset."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": test_user.email, "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 400
    assert "Incorrect" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "nobody@kitsu.io", "password": "password"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_new_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@kitsu.io",
            "username": "newuser",
            "password": "securepassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@kitsu.io"
    assert data["username"] == "newuser"
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_user.email, "username": "otherusername", "password": "password123"},
    )
    assert response.status_code == 400
    assert "email exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "unique@kitsu.io", "username": test_user.username, "password": "password123"},
    )
    assert response.status_code == 400
    assert "username exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, test_user):
    login_resp = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": test_user.email, "password": "testpassword123"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh-token",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] != login_resp.json()["access_token"]


@pytest.mark.asyncio
async def test_refresh_with_access_token_fails(client: AsyncClient, test_user):
    login_resp = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": test_user.email, "password": "testpassword123"},
    )
    access_token = login_resp.json()["access_token"]

    response = await client.post(
        "/api/v1/auth/refresh-token",
        json={"refresh_token": access_token},
    )
    assert response.status_code in (400, 403)


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/refresh-token",
        json={"refresh_token": "invalid.token.here"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_change_password_correct(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "testpassword123", "new_password": "newpassword456"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert "changed" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "wrongpassword", "new_password": "newpassword456"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_change_password_too_short(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "testpassword123", "new_password": "short"},
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_forgot_password_always_200(client: AsyncClient):
    """Prevent email enumeration: always returns 200."""
    for email in ["real@kitsu.io", "fake@nowhere.invalid"]:
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": email},
        )
        assert response.status_code == 200
        assert "sent" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_unauthenticated_send_verification(client: AsyncClient):
    response = await client.post("/api/v1/auth/send-verification")
    assert response.status_code == 401
