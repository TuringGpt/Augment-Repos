


from rest_framework.generics import CreateAPIView, ListAPIView, DestroyAPIView

from .serializers import StartDirectFileUploadSerializer, DirectLocalFileUploadSerializer
from .serializers import FinishFileUploadSerializer, FileSerializer

from rest_framework.permissions import IsAuthenticated
from accounts.permissions import hasAdminRole
from .models import File


class StartDirectFileUpload(CreateAPIView):
    serializer_class = StartDirectFileUploadSerializer
    permission_classes = [IsAuthenticated]


class DirectLocalFileUpload(CreateAPIView):
    serializer_class = DirectLocalFileUploadSerializer
    permission_classes = [IsAuthenticated]


class FinishDirectFileUploadFinish(CreateAPIView):
    serializer_class = FinishFileUploadSerializer
    permission_classes = [IsAuthenticated]


class AdminFileListView(ListAPIView):
    """Admin-only view to list all uploaded files globally."""
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    queryset = File.objects.all()

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')


class AdminFileDeleteView(DestroyAPIView):
    """Admin-only view to delete any uploaded file."""
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    queryset = File.objects.all()

    def perform_destroy(self, instance):
        # Clean up actual file blobs from storage before deleting the DB row
        if instance.file:
            instance.file.delete(save=False)
        if instance.thumbnail:
            instance.thumbnail.delete(save=False)
        instance.delete()

