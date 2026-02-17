import json
import functools
from typing import Any, Optional, Union
from datetime import timedelta
from redis.asyncio import Redis
from app.core.config import settings
from app.core.logging import logger

class CacheService:
    def __init__(self):
        self.redis: Optional[Redis] = None
        self.enabled = settings.API_ENV != "test"

    async def connect(self):
        if not self.redis:
            try:
                self.redis = Redis.from_url(str(settings.REDIS_URL), decode_responses=True)
                logger.info("Connected to Redis cache cluster")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self.enabled = False

    async def disconnect(self):
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        if not self.enabled or not self.redis:
            return None
        try:
            data = await self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        if not self.enabled or not self.redis:
            return
        try:
            await self.redis.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.error(f"Cache set error: {e}")

    async def delete(self, key: str):
        if not self.enabled or not self.redis:
            return
        await self.redis.delete(key)

    async def clear_prefix(self, prefix: str):
        if not self.enabled or not self.redis:
            return
        keys = await self.redis.keys(f"{prefix}*")
        if keys:
            await self.redis.delete(*keys)

cache = CacheService()

def cached(prefix: str, expire: int = 300):
    """
    Decorator for caching FastAPI endpoint results.
    Key is generated from prefix + function arguments.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Skip cache in testing or if disabled
            if not cache.enabled:
                return await func(*args, **kwargs)

            # Generate unique key from arguments (filtering out non-serializable like db session)
            cache_args = {k: v for k, v in kwargs.items() if not k.endswith('db') and not k.startswith('current_user')}
            key = f"{prefix}:{json.dumps(cache_args, sort_keys=True)}"
            
            cached_val = await cache.get(key)
            if cached_val is not None:
                return cached_val
            
            result = await func(*args, **kwargs)
            await cache.set(key, result, expire=expire)
            return result
        return wrapper
    return decorator
