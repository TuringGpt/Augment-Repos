from accounts.models import User
from core.models import BaseModel
from .storage_backends import PublicMediaStorage, PrivateMediaStorage
from django.db import models
from .utils import file_generate_upload_path




class File(BaseModel):
    file = models.FileField(
        upload_to=file_generate_upload_path,
        blank=True,
        null=True,
        storage=PublicMediaStorage(),
    )

    thumbnail = models.FileField(
        upload_to=file_generate_upload_path,
        blank=True,
        null=True,
        storage=PublicMediaStorage(),
    )

    original_file_name = models.TextField()

    file_name = models.CharField(max_length=255, unique=True)
    file_type = models.CharField(max_length=255)

    created_by = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    upload_finished_at = models.DateTimeField(blank=True, null=True)








