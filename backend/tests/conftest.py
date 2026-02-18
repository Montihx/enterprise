"""
Test configuration: uses in-memory SQLite for fast, isolated unit tests.
Integration tests requiring PostgreSQL are marked with @pytest.mark.integration.
"""
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.db.base import Base
from app.main import app
from app.api import deps
from app.core.security import get_password_hash
from app.core.config import settings


# ─── Test Database (SQLite in-memory) ────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def create_tables():
    """Create all tables once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Per-test database session with rollback for isolation."""
    async with test_engine.begin() as conn:
        async with AsyncSession(conn) as session:
            yield session
            await session.rollback()


# ─── Override FastAPI DB dependency ──────────────────────────────────────────

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[deps.get_db] = override_get_db


# ─── HTTP Client ─────────────────────────────────────────────────────────────

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


# ─── Test Data Factories ─────────────────────────────────────────────────────

@pytest.fixture
async def test_user(db: AsyncSession):
    """Create a standard test user."""
    from app.models.user import User
    user = User(
        email="testuser@kitsu.io",
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_superuser=False,
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def superuser(db: AsyncSession):
    """Create a superuser for admin endpoint tests."""
    from app.models.user import User
    user = User(
        email="admin@kitsu.io",
        username="admin",
        hashed_password=get_password_hash("adminpassword123"),
        is_active=True,
        is_superuser=True,
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def test_anime(db: AsyncSession):
    """Create a test anime record."""
    from app.models.anime import Anime
    anime = Anime(
        title="Тест Аниме",
        title_en="Test Anime",
        slug="test-anime",
        kind="tv",
        status="ongoing",
    )
    db.add(anime)
    await db.commit()
    await db.refresh(anime)
    return anime


@pytest.fixture
async def auth_headers(client: AsyncClient, test_user):
    """Get auth headers for authenticated requests."""
    response = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": test_user.email, "password": "testpassword123"},
    )
    assert response.status_code == 200, f"Auth failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_headers(client: AsyncClient, superuser):
    """Get auth headers for admin requests."""
    response = await client.post(
        "/api/v1/auth/login/access-token",
        data={"username": superuser.email, "password": "adminpassword123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
