


from rest_framework.generics import CreateAPIView

from .serializers import StartDirectFileUploadSerializer
from .serializers import FinishFileUploadSerializer

from accounts.permissions import hasAdminOrMerchantRole
from rest_framework.permissions import IsAuthenticated


class StartDirectFileUpload(CreateAPIView):
    serializer_class = StartDirectFileUploadSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]


class FinishDirectFileUploadFinish(CreateAPIView):
    serializer_class = FinishFileUploadSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]


