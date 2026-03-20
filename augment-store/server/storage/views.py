


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

        # Capture each field's name and storage independently so cleanup
        # targets the correct backend even if file and thumbnail differ.
        file_name = instance.file.name if instance.file else None
        file_storage = instance.file.storage if instance.file else None
        thumb_name = instance.thumbnail.name if instance.thumbnail else None
        thumb_storage = instance.thumbnail.storage if instance.thumbnail else None

        instance.delete()

        # Defer blob cleanup until after the transaction commits.
        # Errors are caught so transient storage failures don't surface
        # as 500s after the DB row has already been removed.
        def cleanup():
            try:
                if file_name and file_storage:
                    file_storage.delete(file_name)
                if thumb_name and thumb_storage:
                    thumb_storage.delete(thumb_name)
            except Exception:
                logger.exception(
                    "Failed to clean up storage blobs for deleted file "
                    "(file=%s, thumbnail=%s). Manual cleanup may be required.",
                    file_name, thumb_name
                )

        if file_name or thumb_name:
            transaction.on_commit(cleanup)

