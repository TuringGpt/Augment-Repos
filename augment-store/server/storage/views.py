

from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import hasAdminRole
from core.optimization import AutoOptimizeMixin
from core.service import CachedListMixin, BaseCacheService

from .models import File
from .serializers import (StartDirectFileUploadSerializer, DirectLocalFileUploadSerializer, 
                         FinishFileUploadSerializer, FileListSerializer)

class AdminFileCacheService(BaseCacheService):
    OBJECT_NAME = "admin_file"
    VERSION = 1


class StartDirectFileUpload(CreateAPIView):
    serializer_class = StartDirectFileUploadSerializer
    permission_classes = [IsAuthenticated]


class DirectLocalFileUpload(CreateAPIView):
    serializer_class = DirectLocalFileUploadSerializer
    permission_classes = [IsAuthenticated]


class FinishDirectFileUploadFinish(CreateAPIView):
    serializer_class = FinishFileUploadSerializer
    permission_classes = [IsAuthenticated]


class AdminFileListView(CachedListMixin, AutoOptimizeMixin, ListAPIView):
    """
    Admin-only view to list all files in the system.
    """
    serializer_class = FileListSerializer
    permission_classes = [IsAuthenticated, hasAdminRole]
    cache_service_class = AdminFileCacheService
    queryset = File.objects.all()

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False).order_by('-created_at')


