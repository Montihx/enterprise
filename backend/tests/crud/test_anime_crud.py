import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_anime import anime as crud_anime
from app.schemas.anime import AnimeCreate, AnimeUpdate

@pytest.mark.asyncio
async def test_create_anime_crud(db_session: AsyncSession):
    anime_in = AnimeCreate(title="CRUD Test", slug="crud-test", kind="tv", status="released")
    anime = await crud_anime.create(db_session, obj_in=anime_in)
    assert anime.title == "CRUD Test"
    assert anime.slug == "crud-test"

@pytest.mark.asyncio
async def test_get_anime_by_slug(db_session: AsyncSession):
    anime_in = AnimeCreate(title="Slug Test", slug="slug-test")
    await crud_anime.create(db_session, obj_in=anime_in)
    anime = await crud_anime.get_by_slug(db_session, slug="slug-test")
    assert anime is not None
    assert anime.title == "Slug Test"

@pytest.mark.asyncio
async def test_update_anime_crud(db_session: AsyncSession):
    anime_in = AnimeCreate(title="Old Title", slug="update-test")
    anime = await crud_anime.create(db_session, obj_in=anime_in)
    
    update_in = AnimeUpdate(title="New Title")
    updated_anime = await crud_anime.update(db_session, db_obj=anime, obj_in=update_in)
    assert updated_anime.title == "New Title"

@pytest.mark.asyncio
async def test_delete_anime_crud(db_session: AsyncSession):
    anime_in = AnimeCreate(title="Delete Me", slug="delete-me")
    anime = await crud_anime.create(db_session, obj_in=anime_in)
    
    deleted_anime = await crud_anime.delete(db_session, id=anime.id)
    assert deleted_anime.id == anime.id
    
    found = await crud_anime.get(db_session, id=anime.id)
    assert found is None

@pytest.mark.asyncio
async def test_get_multi_paginated_filters(db_session: AsyncSession):
    await crud_anime.create(db_session, obj_in=AnimeCreate(title="A", slug="a", kind="tv"))
    await crud_anime.create(db_session, obj_in=AnimeCreate(title="B", slug="b", kind="movie"))
    
    items, total = await crud_anime.get_multi_paginated(db_session, kind="tv")
    assert total >= 1
    assert any(i.kind == "tv" for i in items)
