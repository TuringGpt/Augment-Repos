from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import hasAdminRole
from .models import ContactMessage
from .serializers import ContactMessageSerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class ContactCacheService(BaseCacheService):
    OBJECT_NAME = "contact"
    VERSION = 1


class BaseContactView(AutoOptimizeMixin):
    serializer_class = ContactMessageSerializer
    queryset = ContactMessage.objects.all()

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
class ContactListView(CachedListMixin, BaseContactView, ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = ContactCacheService
    cache_ttl = 60 * 30

class CreateContactView(CacheInvalidatorMixin, BaseContactView, CreateAPIView):
    serializer_class = ContactMessageSerializer
    cache_service_class = ContactCacheService

class ContactDetailView(CacheInvalidatorMixin, BaseContactView, RetrieveUpdateDestroyAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = ContactCacheService
