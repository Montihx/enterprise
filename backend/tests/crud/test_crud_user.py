"""User CRUD unit tests."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_user import user as crud_user
from app.schemas.user import UserCreate


@pytest.mark.asyncio
async def test_create_user(db: AsyncSession):
    obj = UserCreate(email="crudtest@kitsu.io", username="crudtest", password="securepass123")
    user = await crud_user.create(db, obj_in=obj)
    assert user.id is not None
    assert user.email == "crudtest@kitsu.io"
    assert user.hashed_password != "securepass123"  # must be hashed


@pytest.mark.asyncio
async def test_authenticate_user(db: AsyncSession):
    obj = UserCreate(email="auth_test@kitsu.io", username="authtest", password="mypassword123")
    await crud_user.create(db, obj_in=obj)
    authed = await crud_user.authenticate(db, email="auth_test@kitsu.io", password="mypassword123")
    assert authed is not None
    assert authed.email == "auth_test@kitsu.io"


@pytest.mark.asyncio
async def test_authenticate_wrong_password(db: AsyncSession):
    obj = UserCreate(email="wp_test@kitsu.io", username="wptest", password="rightpassword")
    await crud_user.create(db, obj_in=obj)
    result = await crud_user.authenticate(db, email="wp_test@kitsu.io", password="wrongpassword")
    assert result is None


@pytest.mark.asyncio
async def test_get_by_email(db: AsyncSession):
    obj = UserCreate(email="gbe@kitsu.io", username="gbeuser", password="password123")
    created = await crud_user.create(db, obj_in=obj)
    fetched = await crud_user.get_by_email(db, email="gbe@kitsu.io")
    assert fetched is not None
    assert fetched.id == created.id


@pytest.mark.asyncio
async def test_get_nonexistent_user(db: AsyncSession):
    result = await crud_user.get_by_email(db, email="nobody@nowhere.io")
    assert result is None


@pytest.mark.asyncio
async def test_update_user_bio(db: AsyncSession):
    obj = UserCreate(email="bio@kitsu.io", username="biotest", password="password123")
    user = await crud_user.create(db, obj_in=obj)
    updated = await crud_user.update(db, db_obj=user, obj_in={"bio": "Hello world"})
    assert updated.bio == "Hello world"
