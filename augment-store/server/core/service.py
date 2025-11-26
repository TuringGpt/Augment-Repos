import json
import hashlib
from django.core.cache import cache


class BaseCacheService:
    OBJECT_NAME = "base_cache"
    VERSION = 1
    DEFAULT_TTL = 60 * 5  # 5 minutes

    def _serialize_params(self, params: dict):
        """Serialize params in stable sort order."""
        return json.dumps(params or {}, sort_keys=True)

    def _hash_tail(self, text: str):
        """
        Create a short, safe hash for backend-agnostic cache keys.
        Using SHA1 is enough for uniqueness & shortness.
        """
        return hashlib.sha1(text.encode("utf-8")).hexdigest()[:20]  # 20 chars

    def get_cache_namespace(self):
        return self.OBJECT_NAME

    def get_cache_key(
        self,
        user_id=None,
        query_params=None,
        custom_key: str = None
    ):
        namespace = self.get_cache_namespace()
        version = f"v{self.VERSION}"

        # Determine tail source
        if custom_key:
            tail_source = custom_key
        else:
            serialized = self._serialize_params(query_params)
            tail_source = f"{user_id}:{serialized}"

        # Always hashed → safe short key
        tail_hash = self._hash_tail(tail_source)

        # Final backend-agnostic key
        return f"{namespace}:{version}:{tail_hash}"

    def set(self, key: str, value, ttl: int = None):
        if ttl == 0:
            # Caller explicitly opts out of caching
            return

        # None means use default TTL
        effective_ttl = self.DEFAULT_TTL if ttl is None else ttl
        cache.set(key, value, timeout=effective_ttl)

    def get(self, key: str):
        return cache.get(key)

    def delete(self, key: str):
        cache.delete(key)


    def clear_namespace(self):
        """
        Clears all Redis keys belonging to this cache namespace,
        automatically respecting django-redis KEY_PREFIX.
        """
        try:
            redis_client = cache.client.get_client(write=True)

            # Get key prefix applied by django-redis (may be "")
            key_prefix = cache.client.make_key("")  # already includes : if used
            # make_key("") returns something like "myapp:" or "" (no prefix)

            # Namespace pattern WITHOUT prefix
            namespace = f"{self.get_cache_namespace()}:v{self.VERSION}:*"

            # Final pattern INCLUDING prefix
            pattern = f"{key_prefix}{namespace}"

            for key in redis_client.scan_iter(match=pattern):
                redis_client.delete(key)

        except Exception:
            pass

