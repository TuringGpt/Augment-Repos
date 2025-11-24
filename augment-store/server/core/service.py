import json
from django.core.cache import cache


class BaseCacheService:
    # Override these in subclasses
    OBJECT_NAME = "base_cache"
    VERSION = 1                 # cache versioning for invalidation
    DEFAULT_TTL = 60 * 5        # default TTL = 5 minutes

    def _serialize_params(self, params: dict):
        """Stable serialization for deterministic cache keys."""
        return json.dumps(params or {}, sort_keys=True)

    def get_cache_namespace(self):
        """Namespace derived from class or overridden."""
        return self.OBJECT_NAME

    def get_cache_key(
        self, 
        user_id=None, 
        query_params=None, 
        custom_key: str = None
    ):
        """
        Builds a stable versioned cache key:
        <namespace>:v<version>:<user_id>:<serialized_params or custom_key>
        """
        namespace = self.get_cache_namespace()
        version = f"v{self.VERSION}"

        if custom_key:
            tail = custom_key
        else:
            tail = self._serialize_params(query_params)

        return f"{namespace}:{version}:{user_id}:{tail}"

    def set(self, key: str, value, ttl: int = None):
        """Store value with TTL."""
        cache.set(key, value, timeout=ttl or self.DEFAULT_TTL)

    def get(self, key: str):
        """Retrieve from cache."""
        return cache.get(key)

    def delete(self, key: str):
        """Delete a key."""
        cache.delete(key)

    def clear_namespace(self):
        """
        Clears all keys in this namespace (only works with Redis).
        Recommended only when using Redis `SCAN` or `keys` command.
        """
        pattern = f"{self.get_cache_namespace()}:v{self.VERSION}:*"
        try:
            redis_client = cache.client.get_client(write=True)
            for key in redis_client.scan_iter(match=pattern):
                redis_client.delete(key)
        except Exception:
            pass
