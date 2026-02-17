import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.crud.crud_user import user as crud_user
from app.crud.crud_role import role as crud_role
from app.schemas.user import UserCreate
from app.schemas.role import RoleCreate

@pytest.fixture
async def moderator_token(client: AsyncClient, db_session):
    # Ensure role exists
    mod_role = await crud_role.get_by_name(db_session, "moderator")
    if not mod_role:
        mod_role = await crud_role.create(db_session, obj_in=RoleCreate(
            name="moderator", 
            permissions=["content.edit", "content.view"]
        ))
    
    user_in = UserCreate(email="mod@test.com", username="moduser", password="pass", is_superuser=False)
    user = await crud_user.create(db_session, obj_in=user_in)
    user.role_id = mod_role.id
    db_session.add(user)
    await db_session.commit()
    return create_access_token(user.id)

@pytest.fixture
async def regular_user_token(client: AsyncClient, db_session):
    user_in = UserCreate(email="user@test.com", username="regular", password="pass", is_superuser=False)
    user = await crud_user.create(db_session, obj_in=user_in)
    return create_access_token(user.id)

@pytest.mark.asyncio
async def test_admin_endpoint_denied_for_regular_user(client: AsyncClient, regular_user_token: str):
    headers = {"Authorization": f"Bearer {regular_user_token}"}
    # Attempt to create anime as regular user
    response = await client.post(
        "/api/v1/anime/",
        json={"title": "Hack", "slug": "hack"},
        headers=headers
    )
    assert response.status_code == 403
    assert "permissions" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_admin_endpoint_allowed_for_moderator(client: AsyncClient, moderator_token: str):
    headers = {"Authorization": f"Bearer {moderator_token}"}
    response = await client.post(
        "/api/v1/anime/",
        json={"title": "Mod Created", "slug": "mod-created"},
        headers=headers
    )
    assert response.status_code == 201
    assert response.json()["data"]["title"] == "Mod Created"
