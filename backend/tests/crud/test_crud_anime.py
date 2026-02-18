"""Anime CRUD unit tests."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_anime import anime as crud_anime
from app.schemas.anime import AnimeCreate, AnimeUpdate


@pytest.mark.asyncio
async def test_create_anime(db: AsyncSession):
    obj = AnimeCreate(title="Наруто", slug="naruto", kind="tv", status="finished")
    anime = await crud_anime.create(db, obj_in=obj)
    assert anime.id is not None
    assert anime.title == "Наруто"
    assert anime.slug == "naruto"


@pytest.mark.asyncio
async def test_get_anime_by_slug(db: AsyncSession):
    obj = AnimeCreate(title="Bleach", slug="bleach", kind="tv", status="finished")
    created = await crud_anime.create(db, obj_in=obj)
    fetched = await crud_anime.get_by_slug(db, slug="bleach")
    assert fetched is not None
    assert fetched.id == created.id


@pytest.mark.asyncio
async def test_update_anime(db: AsyncSession):
    obj = AnimeCreate(title="One Piece", slug="one-piece", kind="tv", status="ongoing")
    anime = await crud_anime.create(db, obj_in=obj)
    updated = await crud_anime.update(db, db_obj=anime, obj_in=AnimeUpdate(score=9.1))
    assert updated.score == pytest.approx(9.1)


@pytest.mark.asyncio
async def test_delete_anime(db: AsyncSession):
    obj = AnimeCreate(title="Temp Anime", slug="temp-anime", kind="tv", status="ongoing")
    anime = await crud_anime.create(db, obj_in=obj)
    anime_id = anime.id
    await crud_anime.remove(db, id=anime_id)
    fetched = await crud_anime.get(db, id=anime_id)
    assert fetched is None


@pytest.mark.asyncio
async def test_get_multi_anime(db: AsyncSession):
    for i in range(3):
        obj = AnimeCreate(title=f"Anime {i}", slug=f"anime-{i}", kind="tv", status="ongoing")
        await crud_anime.create(db, obj_in=obj)
    results = await crud_anime.get_multi(db, limit=10)
    assert len(results) >= 3


@pytest.mark.asyncio
async def test_slug_unique_constraint(db: AsyncSession):
    """Creating two anime with same slug should fail."""
    from sqlalchemy.exc import IntegrityError
    obj = AnimeCreate(title="Dupe", slug="dupe-slug", kind="tv", status="ongoing")
    await crud_anime.create(db, obj_in=obj)
    with pytest.raises(Exception):  # IntegrityError or similar
        obj2 = AnimeCreate(title="Dupe 2", slug="dupe-slug", kind="tv", status="ongoing")
        await crud_anime.create(db, obj_in=obj2)
