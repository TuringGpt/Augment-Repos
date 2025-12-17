import json
import hashlib
import functools


from django.core.cache import cache
from rest_framework.response import Response


class BaseCacheService:
    OBJECT_NAME = "base_cache"
    VERSION = 1
    DEFAULT_TTL = 60 * 5  # 5 minutes

    def _serialize_params(self, params: dict):
        """Serialize params in stable sort order."""
        if hasattr(params, 'lists'):
            # Handle QueryDict with multi-values by converting to dict of lists
            params = dict(params.lists())
        elif hasattr(params, 'dict'):
            params = params.dict()
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


class CachedListMixin:
    cache_service_class = BaseCacheService  # override this per view
    cache_ttl = None  # default TTL or override

    def get_cache_service(self):
        return self.cache_service_class()

    def generate_cache_key(self):
        service = self.get_cache_service()
        return service.get_cache_key(
            user_id=getattr(self.request.user, "id", None),
            query_params=self.request.query_params
        )

    def list(self, request, *args, **kwargs):
        service = self.get_cache_service()
        cache_key = self.generate_cache_key()

        cached = service.get(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        service.set(cache_key, response.data, ttl=self.cache_ttl)
        return response
    

class CacheInvalidatorMixin:
    cache_service_class = BaseCacheService  # override this per view

    def get_cache_service(self):
        return self.cache_service_class()

    def invalidate_cache(self):
        service = self.get_cache_service()
        service.clear_namespace()

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self.invalidate_cache()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        self.invalidate_cache()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        self.invalidate_cache()


class CachedRetrieveMixin:
    cache_service_class = BaseCacheService  # override this per view
    cache_ttl = None  # default TTL or override
    lookup_field = 'pk'

    def get_cache_service(self):
        return self.cache_service_class()

    def generate_cache_key(self):
        service = self.get_cache_service()
        # Include lookup field (usually pk), user_id, and query params in the key
        lookup_kwarg = getattr(self, 'lookup_url_kwarg', None) or self.lookup_field
        obj_id = self.kwargs.get(lookup_kwarg)
        user_id = getattr(self.request.user, "id", None)
        query_params = self.request.query_params
        
        # We manually construct the key components to ensure uniqueness for detailed views
        serialized_params = service._serialize_params(query_params)
        custom_key_content = f"retrieve:{obj_id}:{user_id}:{serialized_params}"
        
        return service.get_cache_key(custom_key=custom_key_content)

    def retrieve(self, request, *args, **kwargs):
        service = self.get_cache_service()
        cache_key = self.generate_cache_key()

        cached = service.get(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().retrieve(request, *args, **kwargs)
        service.set(cache_key, response.data, ttl=self.cache_ttl)
        return response


def cache_response(ttl=None, key_prefix=None):
    """
    Decorator for caching DRF ViewSet actions (returning Response objects).
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            # Attempt to use the cache service from the viewset if available, else default
            if hasattr(view_instance, 'get_cache_service'):
                service = view_instance.get_cache_service()
            else:
                service = BaseCacheService()
            
            # Helper to generate key
            user_id = getattr(request.user, "id", None)
            serialized_params = service._serialize_params(request.query_params)
            
            # Construct a unique key
            # If key_prefix is not provided, use function name
            prefix = key_prefix or view_func.__name__
            custom_key = f"action:{prefix}:{user_id}:{serialized_params}"
            
            cache_key = service.get_cache_key(custom_key=custom_key)
            
            # Check cache
            cached_data = service.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)
            
            # Execute view
            response = view_func(view_instance, request, *args, **kwargs)
            
            # Cache data (only if response is successfulish? typically 200 OK)
            # For simplicity, we cache the .data if it exists and status is success
            if hasattr(response, 'data') and 200 <= response.status_code < 300:
                # Determine TTL
                effective_ttl = ttl if ttl is not None else getattr(view_instance, 'cache_ttl', None)
                service.set(cache_key, response.data, ttl=effective_ttl)
                
            return response
        return _wrapped_view
    return decorator
