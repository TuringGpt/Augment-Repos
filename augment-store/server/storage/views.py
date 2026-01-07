


from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    DirectLocalFileUploadSerializer,
    FinishFileUploadSerializer,
    StartDirectFileUploadSerializer,
)


class StartDirectFileUpload(CreateAPIView):
    serializer_class = StartDirectFileUploadSerializer
    permission_classes = [IsAuthenticated]


class DirectLocalFileUpload(CreateAPIView):
    serializer_class = DirectLocalFileUploadSerializer
    permission_classes = [IsAuthenticated]


class FinishDirectFileUploadFinish(CreateAPIView):
    serializer_class = FinishFileUploadSerializer
    permission_classes = [IsAuthenticated]


