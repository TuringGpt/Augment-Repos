from rest_framework.generics import RetrieveUpdateAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from .permissions import hasAdminRole
from .models import User
from .serializers import UserProfileSerializer, UpdateUserProfileSerializer, UserListSerializer, AdminUserUpdateSerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedRetrieveMixin, CachedListMixin, CacheInvalidatorMixin
from .services import UserProfileCacheService, AdminUserCacheService


class UserProfileView(CachedRetrieveMixin, CacheInvalidatorMixin, AutoOptimizeMixin, RetrieveUpdateAPIView):
    """
    View for retrieving and updating the authenticated user's profile.

    GET: Retrieve the current user's profile information
    PATCH/PUT: Update the current user's profile information
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    cache_service_class = UserProfileCacheService
    cache_ttl = 60 * 10
    auto_select_related = ['profile_image', 'preferred_currency']
    queryset = User.objects.all()

    def get_object(self):
        """Return the current authenticated user from the optimized queryset"""
        from django.shortcuts import get_object_or_404
        return get_object_or_404(self.get_queryset(), pk=self.request.user.pk)

    def get_serializer_class(self):
        """Use different serializers for read and write operations"""
        if self.request.method in ['PATCH', 'PUT']:
            return UpdateUserProfileSerializer
        return UserProfileSerializer


class AdminUserListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    """Admin-only view to list all registered users with caching."""
    # Note: cached data contains user PII (email, name, mobile). Access is
    # restricted to admin users only. TTL kept short to limit retention in cache.
    permission_classes = [IsAuthenticated, hasAdminRole]
    serializer_class = UserListSerializer
    cache_service_class = AdminUserCacheService
    cache_ttl = 60 * 5
    auto_select_related = ['profile_image', 'preferred_currency']
    auto_prefetch_related = ['merchant_detail']
    queryset = User.objects.all().order_by('-date_joined')

    def generate_cache_key(self):
        # Use a shared cache key (no user_id) since the admin user list is
        # identical for all admins. Avoids per-admin cache duplication and
        # reduces the number of PII copies stored in the cache backend.
        #
        # Caveat: paginated responses include absolute next/previous URLs
        # derived from the originating request's host/scheme. If the API is
        # served behind multiple domains or proxy schemes, the cached URLs
        # may not match subsequent requests. Acceptable for single-domain
        # deployments; revisit if multi-domain access is introduced.
        service = self.get_cache_service()
        return service.get_cache_key(
            user_id=None,
            query_params=self.request.query_params
        )


class AdminUserUpdateView(CacheInvalidatorMixin, RetrieveUpdateAPIView):
    """Admin-only view to update a specific user's role or active status."""
    permission_classes = [IsAuthenticated, hasAdminRole]
    serializer_class = AdminUserUpdateSerializer
    cache_service_class = AdminUserCacheService
    queryset = User.objects.all()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        # Evict the entire user_profile cache namespace. Per-key deletion is
        # possible via BaseCacheService.delete(key), but deriving the exact
        # cache keys for the affected user's profile responses is non-trivial
        # from this view context. Since admin role/status changes are
        # infrequent, broad namespace eviction is an acceptable trade-off.
        UserProfileCacheService().clear_namespace()
