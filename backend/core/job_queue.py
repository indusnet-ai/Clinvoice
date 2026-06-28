"""
Job Queue Configuration

ARQ (Async Redis Queue) setup for background task processing.
Provides async-native task queuing with Redis as the broker.
"""

from arq import create_pool
from arq.connections import RedisSettings, ArqRedis
from typing import Optional
import logging

from core.config import settings

logger = logging.getLogger(__name__)

# Parse Redis URL to get host and port
def parse_redis_url(url: str) -> tuple[str, int]:
    """Parse redis://host:port URL format."""
    url = url.replace("redis://", "")
    if ":" in url:
        host, port = url.split(":")
        return host, int(port)
    return url, 6379


REDIS_HOST, REDIS_PORT = parse_redis_url(settings.REDIS_URL)


def get_redis_settings() -> RedisSettings:
    """Get ARQ Redis connection settings."""
    return RedisSettings(
        host=REDIS_HOST,
        port=REDIS_PORT,
    )


async def create_redis_pool() -> ArqRedis:
    """Create and return an ARQ Redis connection pool."""
    return await create_pool(get_redis_settings())


# Global redis pool (initialized in lifespan)
_redis_pool: Optional[ArqRedis] = None


async def get_redis_pool() -> ArqRedis:
    """Get the global Redis pool. Must be initialized first."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = await create_redis_pool()
    return _redis_pool


async def close_redis_pool():
    """Close the global Redis pool."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None
