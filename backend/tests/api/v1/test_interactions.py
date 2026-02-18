"""Interaction tests: comments CRUD, likes, replies, favorites, watch progress."""
import pytest
from httpx import AsyncClient
from uuid import uuid4


@pytest.mark.asyncio
async def test_create_comment_authenticated(client: AsyncClient, auth_headers, test_anime):
    response = await client.post(
        "/api/v1/interactions/comments",
        json={"content": "Отличное аниме!", "anime_id": str(test_anime.id)},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Отличное аниме!"
    assert data["likes_count"] == 0


@pytest.mark.asyncio
async def test_create_comment_unauthenticated(client: AsyncClient, test_anime):
    response = await client.post(
        "/api/v1/interactions/comments",
        json={"content": "test", "anime_id": str(test_anime.id)},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_comments_empty(client: AsyncClient, test_anime):
    response = await client.get(
        f"/api/v1/interactions/comments?anime_id={test_anime.id}"
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_comment_injection_blocked(client: AsyncClient, auth_headers, test_anime):
    """Verify CommentCreate schema blocks is_hidden injection."""
    response = await client.post(
        "/api/v1/interactions/comments",
        json={
            "content": "test",
            "anime_id": str(test_anime.id),
            "is_hidden": True,  # should be ignored
            "user_id": str(uuid4()),  # should be ignored
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data.get("is_hidden") == False  # Not injected


@pytest.mark.asyncio
async def test_delete_own_comment(client: AsyncClient, auth_headers, test_anime):
    # Create
    create_resp = await client.post(
        "/api/v1/interactions/comments",
        json={"content": "Удалите меня", "anime_id": str(test_anime.id)},
        headers=auth_headers,
    )
    comment_id = create_resp.json()["id"]

    # Delete
    delete_resp = await client.delete(
        f"/api/v1/interactions/comments/{comment_id}",
        headers=auth_headers,
    )
    assert delete_resp.status_code == 204

    # Should not appear in list (soft-deleted)
    list_resp = await client.get(f"/api/v1/interactions/comments?anime_id={test_anime.id}")
    comment_ids = [c["id"] for c in list_resp.json()]
    assert comment_id not in comment_ids


@pytest.mark.asyncio
async def test_like_comment(client: AsyncClient, auth_headers, test_anime):
    # Create comment
    create_resp = await client.post(
        "/api/v1/interactions/comments",
        json={"content": "Лайкните меня", "anime_id": str(test_anime.id)},
        headers=auth_headers,
    )
    comment_id = create_resp.json()["id"]

    # Like
    like_resp = await client.post(
        f"/api/v1/interactions/comments/{comment_id}/like",
        headers=auth_headers,
    )
    assert like_resp.status_code == 200
    data = like_resp.json()
    assert data["liked"] == True
    assert data["likes_count"] >= 1


@pytest.mark.asyncio
async def test_reply_to_comment(client: AsyncClient, auth_headers, test_anime):
    # Create parent
    parent_resp = await client.post(
        "/api/v1/interactions/comments",
        json={"content": "Родительский комментарий", "anime_id": str(test_anime.id)},
        headers=auth_headers,
    )
    parent_id = parent_resp.json()["id"]

    # Reply
    reply_resp = await client.post(
        f"/api/v1/interactions/comments/{parent_id}/reply",
        params={"content": "Ответ на комментарий"},
        headers=auth_headers,
    )
    assert reply_resp.status_code == 201
    data = reply_resp.json()
    assert str(data["parent_id"]) == parent_id
    assert data["thread_depth"] == 1


@pytest.mark.asyncio
async def test_delete_other_user_comment_forbidden(client: AsyncClient, auth_headers, admin_headers, test_anime):
    # Admin creates comment
    create_resp = await client.post(
        "/api/v1/interactions/comments",
        json={"content": "Admin comment", "anime_id": str(test_anime.id)},
        headers=admin_headers,
    )
    comment_id = create_resp.json()["id"]

    # Regular user tries to delete
    delete_resp = await client.delete(
        f"/api/v1/interactions/comments/{comment_id}",
        headers=auth_headers,
    )
    assert delete_resp.status_code == 403


@pytest.mark.asyncio
async def test_toggle_favorite(client: AsyncClient, auth_headers, test_anime):
    response = await client.post(
        f"/api/v1/interactions/favorites?anime_id={test_anime.id}&category=watching",
        headers=auth_headers,
    )
    assert response.status_code == 200

    favorites_resp = await client.get(
        "/api/v1/interactions/favorites", headers=auth_headers
    )
    assert response.status_code == 200
    anime_ids = [str(f["anime_id"]) for f in favorites_resp.json()]
    assert str(test_anime.id) in anime_ids
