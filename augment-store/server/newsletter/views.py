from django.shortcuts import render
from rest_framework.generics import ListAPIView
from .models import Newsletter
from .serializers import NewsletterSerializer

# Create your views here.
class BaseNewsletterView:
    serializer_class = NewsletterSerializer

    def get_queryset(self):
        return Newsletter.objects.all().order_by('-created_at')

class NewsletterView(BaseNewsletterView, ListAPIView):
    serializer_class = NewsletterSerializer

    