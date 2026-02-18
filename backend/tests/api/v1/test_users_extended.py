"""Extended user endpoint tests: profile, avatar, change password."""
import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_update_profile_bio(client: AsyncClient, auth_headers):
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={"bio": "Люблю аниме!"}
    )
    assert response.status_code == 200
    assert response.json()["bio"] == "Люблю аниме!"


@pytest.mark.asyncio
async def test_update_profile_no_token(client: AsyncClient):
    response = await client.put("/api/v1/users/me", json={"bio": "test"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={"current_password": "testpassword123", "new_password": "newpassword456"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers,
        json={"current_password": "wrongpassword", "new_password": "newpassword456"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_avatar_invalid_type(client: AsyncClient, auth_headers):
    """Non-image file should return 400."""
    fake_file = io.BytesIO(b"this is not an image")
    response = await client.post(
        "/api/v1/users/me/avatar",
        headers=auth_headers,
        files={"file": ("malware.exe", fake_file, "application/octet-stream")}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_avatar_too_large(client: AsyncClient, auth_headers):
    """File over 5MB should return 400."""
    big_file = io.BytesIO(b"x" * (6 * 1024 * 1024))
    response = await client.post(
        "/api/v1/users/me/avatar",
        headers=auth_headers,
        files={"file": ("huge.jpg", big_file, "image/jpeg")}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_admin_cannot_access_user_list_as_regular(client: AsyncClient, auth_headers):
    """Regular user cannot list all users."""
    response = await client.get("/api/v1/users/", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_superuser_can_list_users(client: AsyncClient, admin_headers):
    response = await client.get("/api/v1/users/", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
