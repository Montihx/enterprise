"""Rate limiter unit tests — mocked Redis."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.application.auth_rate_limit import (
    RedisRateLimiter,
    RateLimitExceededError,
    check_login_rate_limit,
    record_login_failure,
    reset_login_limit,
)


@pytest.fixture
def mock_redis():
    redis = MagicMock()
    redis.get_counter = AsyncMock(return_value=0)
    redis.increment_counter = AsyncMock()
    redis.delete_counter = AsyncMock()
    return redis


@pytest.mark.asyncio
async def test_not_limited_when_count_below_max(mock_redis):
    with patch("app.application.auth_rate_limit.get_redis", return_value=mock_redis):
        limiter = RedisRateLimiter(max_attempts=5, window_seconds=60)
        mock_redis.get_counter = AsyncMock(return_value=3)
        assert not await limiter.is_limited("test:key")


@pytest.mark.asyncio
async def test_limited_when_count_at_max(mock_redis):
    with patch("app.application.auth_rate_limit.get_redis", return_value=mock_redis):
        limiter = RedisRateLimiter(max_attempts=5, window_seconds=60)
        mock_redis.get_counter = AsyncMock(return_value=5)
        assert await limiter.is_limited("test:key")


@pytest.mark.asyncio
async def test_record_failure_calls_increment(mock_redis):
    with patch("app.application.auth_rate_limit.get_redis", return_value=mock_redis):
        limiter = RedisRateLimiter(max_attempts=5, window_seconds=60)
        await limiter.record_failure("test:key")
        mock_redis.increment_counter.assert_called_once()


@pytest.mark.asyncio
async def test_reset_calls_delete(mock_redis):
    with patch("app.application.auth_rate_limit.get_redis", return_value=mock_redis):
        limiter = RedisRateLimiter(max_attempts=5, window_seconds=60)
        await limiter.reset("test:key")
        mock_redis.delete_counter.assert_called_once()
