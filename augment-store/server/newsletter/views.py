from django.shortcuts import render
from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveUpdateDestroyAPIView
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

    def perform_create(self, serializer):
        serializer.save()

class UnsubscribeNewsletterView(BaseNewsletterView, RetrieveUpdateDestroyAPIView):
    serializer_class = UnsubscribeNewsletterSerializer
    permission_classes = [IsAuthenticated]