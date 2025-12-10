from django.shortcuts import render, get_object_or_404
from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveUpdateAPIView, UpdateAPIView
from .models import Newsletter
from .serializers import NewsletterSerializer, SubscribeNewsletterSerializer, UnsubscribeNewsletterSerializer
from rest_framework.permissions import IsAuthenticated

# Create your views here.
class BaseNewsletterView:
    serializer_class = NewsletterSerializer

    def get_queryset(self):
        return Newsletter.objects.all().order_by('-created_at')

class NewsletterView(BaseNewsletterView, ListAPIView):
    serializer_class = NewsletterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Newsletter.objects.filter(is_active=True).order_by('-created_at')

class SubscribeNewsletterView(BaseNewsletterView, CreateAPIView):
    serializer_class = SubscribeNewsletterSerializer
    permission_classes = [IsAuthenticated]

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
        """Get newsletter subscription by email from request data"""
        email = self.request.data.get('email')
        if not email:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'email': 'Email is required'})

        newsletter = get_object_or_404(Newsletter, email=email)
        return newsletter