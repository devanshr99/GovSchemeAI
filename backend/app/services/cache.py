"""
In-memory TTL cache service.
Provides thread-safe, async-compatible caching with per-key TTL expiration.
Used by dashboard stats, categories, autocomplete, and other hot-path queries.
"""

import asyncio
import time
import logging
from typing import Any, Optional

logger = logging.getLogger("yojana.cache")


class TTLCache:
    """
    Simple in-memory cache with per-key time-to-live (TTL).
    Thread-safe via asyncio.Lock. Suitable for single-process deployments.
    For multi-process / horizontal scaling, swap to Redis.
    """

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expire_time)
        self._lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> Optional[Any]:
        """Get a cached value. Returns None if missing or expired."""
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None
            value, expire_time = entry
            if time.monotonic() > expire_time:
                del self._store[key]
                self._misses += 1
                return None
            self._hits += 1
            return value

    async def set(self, key: str, value: Any, ttl_seconds: float = 60.0):
        """Set a cached value with TTL in seconds."""
        async with self._lock:
            self._store[key] = (value, time.monotonic() + ttl_seconds)

    async def invalidate(self, key: str):
        """Remove a specific key from cache."""
        async with self._lock:
            self._store.pop(key, None)

    async def invalidate_prefix(self, prefix: str):
        """Remove all keys starting with a given prefix."""
        async with self._lock:
            keys_to_delete = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._store[k]

    async def clear(self):
        """Clear entire cache."""
        async with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    async def cleanup_expired(self):
        """Remove all expired entries. Call periodically to free memory."""
        async with self._lock:
            now = time.monotonic()
            expired_keys = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired_keys:
                del self._store[k]
            if expired_keys:
                logger.debug(f"Cache cleanup: removed {len(expired_keys)} expired entries")

    def stats(self) -> dict:
        """Return cache hit/miss statistics."""
        total = self._hits + self._misses
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 2) if total > 0 else 0.0,
            "size": len(self._store),
        }


# Global singleton cache instance
cache = TTLCache()
