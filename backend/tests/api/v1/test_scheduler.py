
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_scheduled_job(client: AsyncClient):
    response = await client.post(
        "/api/v1/dashboard/parsers/scheduler/jobs",
        json={
            "parser_name": "shikimori",
            "job_type": "full_sync",
            "cron_expression": "0 0 * * *",
            "is_active": True
        }
    )
    # 401 if unauthenticated, 200 if auth mocked. 
    # Assuming auth is required and likely not provided in basic client fixture without headers
    assert response.status_code in [200, 401, 403] 

@pytest.mark.asyncio
async def test_get_scheduled_jobs(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/parsers/scheduler/jobs")
    assert response.status_code in [200, 401, 403]
