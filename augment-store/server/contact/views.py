from django.shortcuts import render
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import ContactMessage

# Create your views here.
class ContactView:
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ContactMessage.objects.all().order_by('-created_at')