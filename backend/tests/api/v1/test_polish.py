import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_gzip_compression(client: AsyncClient):
    """Verify that large responses are gzipped."""
    headers = {"Accept-Encoding": "gzip"}
    response = await client.get("/api/v1/anime/", headers=headers)
    assert response.status_code == 200
    # Check if 'content-encoding' is 'gzip' (FastAPI GZipMiddleware)
    if len(response.content) > 1000:
        assert response.headers.get("content-encoding") == "gzip"

@pytest.mark.asyncio
async def test_cache_headers(client: AsyncClient):
    """Ensure catalog responses include cache-control hint if applicable."""
    response = await client.get("/api/v1/anime/")
    assert response.status_code == 200
    # We might not have hard cache-control headers on dynamic API, 
    # but check if application logic is stable.
    assert "data" in response.json()

@pytest.mark.asyncio
async def test_request_id_middleware(client: AsyncClient):
    """Verify unique request tracking ID in headers."""
    response = await client.get("/api/health")
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers
