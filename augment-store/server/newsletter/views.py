from django.shortcuts import render, get_object_or_404
from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveUpdateAPIView, UpdateAPIView
from .models import Newsletter
from .serializers import NewsletterSerializer, SubscribeNewsletterSerializer, UnsubscribeNewsletterSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class NewsletterCacheService(BaseCacheService):
    OBJECT_NAME = "newsletter"
    VERSION = 1


class BaseNewsletterView(AutoOptimizeMixin):
    serializer_class = NewsletterSerializer
    queryset = Newsletter.objects.all()

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')

class NewsletterView(CachedListMixin, BaseNewsletterView, ListAPIView):
    serializer_class = NewsletterSerializer
    permission_classes = [IsAuthenticated]
    cache_service_class = NewsletterCacheService
    cache_ttl = 60 * 60

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class SubscribeNewsletterView(CacheInvalidatorMixin, BaseNewsletterView, CreateAPIView):
    serializer_class = SubscribeNewsletterSerializer
    permission_classes = [IsAuthenticated]
    cache_service_class = NewsletterCacheService

class UnsubscribeNewsletterView(BaseNewsletterView, RetrieveUpdateAPIView):
    serializer_class = UnsubscribeNewsletterSerializer
    permission_classes = [IsAuthenticated]

class UnsubscribeNewsletterByEmailView(BaseNewsletterView, UpdateAPIView):
    """
    Unsubscribe from newsletter using email address.

    PATCH/PUT: Unsubscribe by providing email in request body
    """
    serializer_class = UnsubscribeNewsletterSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        email = self.request.data.get('email')
        if not email:
            raise ValidationError({'email': 'Email is required'})

        newsletter = get_object_or_404(Newsletter, email=email)
        return newsletter