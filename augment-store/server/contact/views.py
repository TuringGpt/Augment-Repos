from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import hasAdminRole

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class BaseContactView:
    serializer_class = ContactMessageSerializer

    def get_queryset(self):
        return ContactMessage.objects.all().order_by('-created_at')

class ContactListView(BaseContactView, ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]

class CreateContactView(BaseContactView, CreateAPIView):
    serializer_class = ContactMessageSerializer

class ContactDetailView(BaseContactView, RetrieveUpdateDestroyAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
