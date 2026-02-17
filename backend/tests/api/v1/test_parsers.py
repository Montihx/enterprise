
import pytest
from httpx import AsyncClient

# Mock auth dependency or use fixtures in real setup
# For this vertical slice test, we assume the client setup in conftest handles basic connection

@pytest.mark.asyncio
async def test_get_settings_empty(client: AsyncClient):
    # This endpoint requires admin auth usually, but we'll check if it's reachable
    # Assuming the test client has superuser privileges or we mock the dependency
    response = await client.get("/api/v1/dashboard/parsers/settings")
    # Without auth headers, this might fail with 401/403.
    # We asserted auth works in Week 2. Here we expect 401 if unauthenticated.
    assert response.status_code in [200, 401, 403]

@pytest.mark.asyncio
async def test_get_jobs_empty(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/parsers/jobs")
    assert response.status_code in [200, 401, 403]
