from rest_framework.generics import CreateAPIView

from .serializers import (
    StartDirectFileUploadSerializer,
    DirectLocalFileUploadSerializer,
)
from .serializers import FinishFileUploadSerializer

from accounts.permissions import hasAdminOrMerchantRole
from rest_framework.permissions import IsAuthenticated


class StartDirectFileUpload(CreateAPIView):
    serializer_class = StartDirectFileUploadSerializer
    permission_classes = [
        IsAuthenticated
    ]  # Allow all authenticated users for avatar uploads


class DirectLocalFileUpload(CreateAPIView):
    serializer_class = DirectLocalFileUploadSerializer
    permission_classes = [
        IsAuthenticated
    ]  # Allow all authenticated users for avatar uploads


class FinishDirectFileUploadFinish(CreateAPIView):
    serializer_class = FinishFileUploadSerializer
    permission_classes = [
        IsAuthenticated
    ]  # Allow all authenticated users for avatar uploads
