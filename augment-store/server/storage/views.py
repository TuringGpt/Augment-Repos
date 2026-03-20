


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
        import logging
        from django.db import transaction

        logger = logging.getLogger(__name__)

        # Capture file references before deleting the DB row
        file_field = instance.file.name if instance.file else None
        thumbnail_field = instance.thumbnail.name if instance.thumbnail else None
        storage = instance.file.storage if instance.file else (instance.thumbnail.storage if instance.thumbnail else None)

        instance.delete()

        # Defer blob cleanup until after the transaction commits.
        # Errors are caught so transient storage failures don't surface
        # as 500s after the DB row has already been removed.
        if storage:
            def cleanup():
                try:
                    if file_field:
                        storage.delete(file_field)
                    if thumbnail_field:
                        storage.delete(thumbnail_field)
                except Exception:
                    logger.exception(
                        "Failed to clean up storage blobs for deleted file "
                        "(file=%s, thumbnail=%s). Manual cleanup may be required.",
                        file_field, thumbnail_field
                    )
            transaction.on_commit(cleanup)

