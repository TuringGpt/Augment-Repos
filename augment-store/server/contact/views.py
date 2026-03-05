from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from accounts.permissions import hasAdminRole
from .models import ContactMessage
from .serializers import ContactMessageSerializer, ContactMessageAdminSerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class ContactCacheService(BaseCacheService):
    OBJECT_NAME = "contact"
    VERSION = 4


class ContactFormAnonThrottle(AnonRateThrottle):
    scope = 'contact_form'
    rate = '5/min'


class ContactFormUserThrottle(UserRateThrottle):
    scope = 'contact_form_user'
    rate = '10/min'


class BaseContactView(AutoOptimizeMixin):
    serializer_class = ContactMessageSerializer
    queryset = ContactMessage.objects.all()

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
class ContactListView(CachedListMixin, BaseContactView, ListAPIView):
    # Note: cached data contains PII (contact details). Access is restricted
    # to admin users only. TTL kept short to limit retention in cache.
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = ContactCacheService
    cache_ttl = 60 * 5  # 5 minutes - short TTL due to PII content

    def get_queryset(self):
        from django.db.models import Q
        queryset = super().get_queryset()

        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            if search:  # Only filter if it's not empty after stripping
                queryset = queryset.filter(
                    Q(name__icontains=search) | Q(email__icontains=search)
                )

        return queryset

class CreateContactView(CacheInvalidatorMixin, BaseContactView, CreateAPIView):
    serializer_class = ContactMessageSerializer
    cache_service_class = ContactCacheService
    throttle_classes = [ContactFormAnonThrottle, ContactFormUserThrottle]

class ContactDetailView(CacheInvalidatorMixin, BaseContactView, RetrieveUpdateDestroyAPIView):
    serializer_class = ContactMessageAdminSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = ContactCacheService
