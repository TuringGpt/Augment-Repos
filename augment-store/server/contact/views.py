from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.exceptions import ValidationError
from accounts.permissions import hasAdminRole
from .models import ContactMessage
from .serializers import ContactMessageSerializer, ContactMessageAdminSerializer
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService
from rest_framework import serializers as drf_serializers


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
    queryset = ContactMessage.objects.filter(is_deleted=False)
    cache_service_class = ContactCacheService
    cache_ttl = 60 * 5  # 5 minutes - short TTL due to PII content

    def get_queryset(self):
        from rest_framework.exceptions import ValidationError
        from django.db.models import Q
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get('status')
        if status_filter:
            valid_statuses = [s.value for s in ContactMessage.Status]
            if status_filter.lower() not in valid_statuses:
                raise ValidationError({'status': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'})
            queryset = queryset.filter(status=status_filter.lower())

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


class BulkStatusUpdateSerializer(drf_serializers.Serializer):
    ids = drf_serializers.ListField(
        child=drf_serializers.UUIDField(),
        allow_empty=False
    )
    status = drf_serializers.ChoiceField(
        choices=ContactMessage.Status.choices
    )


class AdminContactBulkUpdateView(GenericAPIView):
    """Admin endpoint to bulk-update the status of multiple contact messages."""
    permission_classes = [IsAuthenticated, hasAdminRole]
    serializer_class = BulkStatusUpdateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data['ids']
        new_status = serializer.validated_data['status']

        unique_ids = set(ids)
        if ContactMessage.objects.filter(id__in=unique_ids).count() != len(unique_ids):
            raise ValidationError({"ids": ["One or more contact messages do not exist"]})

        updated = ContactMessage.objects.filter(id__in=unique_ids).update(
            status=new_status,
            updated_at=timezone.now()
        )

        # Invalidate the contact list cache so admins see fresh data
        ContactCacheService().clear_namespace()

        return Response(
            {'updated': updated, 'status': new_status},
            status=status.HTTP_200_OK
        )
