from django.shortcuts import render, get_object_or_404
from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveUpdateAPIView, UpdateAPIView, GenericAPIView
from rest_framework.response import Response
from .models import Newsletter
from .serializers import NewsletterSerializer, SubscribeNewsletterSerializer, UnsubscribeNewsletterSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, CacheInvalidatorMixin, BaseCacheService


class NewsletterCacheService(BaseCacheService):
    OBJECT_NAME = "newsletter"
    VERSION = 1


class NewsletterStatusCacheService(BaseCacheService):
    OBJECT_NAME = "newsletter_status"
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
    permission_classes = [AllowAny]
    cache_service_class = NewsletterCacheService


class UnsubscribeNewsletterView(CacheInvalidatorMixin, BaseNewsletterView, RetrieveUpdateAPIView):
    serializer_class = UnsubscribeNewsletterSerializer
    permission_classes = [IsAuthenticated]
    cache_service_class = NewsletterCacheService


class NewsletterStatusView(GenericAPIView):
    """
    Check if an email is subscribed to the newsletter.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=400)
            
        service = NewsletterStatusCacheService()
        # Bug: Missing .lower() normalization for cache key
        cache_key = service.get_cache_key(custom_key=f"status:{email}")
        
        is_subscribed = service.get(cache_key)
        if is_subscribed is None:
            is_subscribed = Newsletter.objects.filter(email=email, is_active=True).exists()
            service.set(cache_key, is_subscribed, ttl=3600)
            
        return Response({"is_subscribed": is_subscribed})


class UnsubscribeNewsletterByEmailView(CacheInvalidatorMixin, BaseNewsletterView, UpdateAPIView):
    """
    Unsubscribe from newsletter using email address.
    """
    serializer_class = UnsubscribeNewsletterSerializer
    permission_classes = [AllowAny]
    cache_service_class = NewsletterCacheService

    def get_object(self):
        email = self.request.data.get('email')
        if not email:
            raise ValidationError({'email': 'Email is required'})

        newsletter = get_object_or_404(Newsletter, email=email)
        return newsletter