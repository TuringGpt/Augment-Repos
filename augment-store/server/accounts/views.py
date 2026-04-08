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


class AdminUserUpdateView(CacheInvalidatorMixin, RetrieveUpdateAPIView):
    """Admin-only view to update a specific user's role or active status."""
    permission_classes = [IsAuthenticated, hasAdminRole]
    serializer_class = AdminUserUpdateSerializer
    cache_service_class = AdminUserCacheService
    queryset = User.objects.all()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        # Also invalidate the affected user's profile cache so role/is_active
        # changes are immediately reflected in their own profile view.
        UserProfileCacheService().clear_namespace()