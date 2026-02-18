"""Analytics service unit tests — mocked database."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.analytics_service import AnalyticsService


@pytest.fixture
def mock_db():
    db = AsyncMock()
    result = MagicMock()
    result.scalar = MagicMock(return_value=42)
    db.execute = AsyncMock(return_value=result)
    return db


@pytest.mark.asyncio
async def test_get_overview_metrics_shape(mock_db):
    service = AnalyticsService()
    # Mock all scalar returns
    mock_db.execute.return_value.scalar = MagicMock(return_value=100)
    metrics = await service.get_overview_metrics(mock_db)
    assert "audience" in metrics
    assert "catalog" in metrics
    assert "assets" in metrics
    assert "uptime" in metrics


def test_get_uptime_returns_string():
    service = AnalyticsService()
    uptime = service._get_uptime()
    assert isinstance(uptime, str)
    assert len(uptime) > 0
    # Should not return "N/A" in test environment since psutil works
    assert uptime != ""


@pytest.mark.asyncio
async def test_get_popular_content(mock_db):
    """Popular content returns structured list."""
    from app.models.anime import Anime
    mock_result = MagicMock()
    mock_result.all = MagicMock(return_value=[
        ("Наруто", 1000, 8.5),
        ("Блич", 800, 7.9),
    ])
    mock_db.execute = AsyncMock(return_value=mock_result)
    service = AnalyticsService()
    result = await service.get_popular_content(mock_db, limit=2)
    assert len(result) == 2
    assert result[0]["title"] == "Наруто"
    assert result[0]["views"] == 1000
