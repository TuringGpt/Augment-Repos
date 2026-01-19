import mimetypes
from typing import Any
from typing import Dict
from typing import List
from typing import Tuple

from accounts.models import User
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from typing_extensions import TypedDict
from .utils import s3_generate_presigned_post

from .enums import FileUploadStorage
from .models import File
from .utils import bytes_to_mib
from .utils import file_generate_local_upload_url
from .utils import file_generate_name
from .utils import file_generate_upload_path


def _validate_file_size(file_obj):

    max_size = settings.FILE_MAX_SIZE

    if file_obj.size > max_size:
        raise ValidationError(
            f"File is too large. It should not exceed {bytes_to_mib(max_size)} MiB"
        )


class FileStandardUploadService:
    """
    This also serves as an example of a service class,
    which encapsulates 2 different behaviors (create & update) under a namespace.

    Meaning, we use the class here for:

    1. The namespace
    2. The ability to reuse `_infer_file_name_and_type` (which can also be an util)
    """

    def __init__(self, user: User, file_obj):
        self.user = user
        self.file_obj = file_obj

    def _infer_file_name_and_type(
        self, file_name: str = "", file_type: str = ""
    ) -> Tuple[str, str]:
        if not file_name:
            file_name = self.file_obj.name

        if not file_type:
            guessed_file_type, encoding = mimetypes.guess_type(file_name)

            if guessed_file_type is None:
                file_type = ""
            else:
                file_type = guessed_file_type

        return file_name, file_type

    @transaction.atomic
    def create(self, file_name: str = "", file_type: str = "") -> File:
        _validate_file_size(self.file_obj)

        file_name, file_type = self._infer_file_name_and_type(
            file_name, file_type
        )

        obj = File(
            file=self.file_obj,
            original_file_name=file_name,
            file_name=file_generate_name(file_name),
            file_type=file_type,
            created_by=self.user,
            upload_finished_at=timezone.now(),
        )

        obj.full_clean()
        obj.save()

        return obj

    @transaction.atomic
    def update(
        self, file: File, file_name: str = "", file_type: str = ""
    ) -> File:
        _validate_file_size(self.file_obj)

        file_name, file_type = self._infer_file_name_and_type(
            file_name, file_type
        )

        file.file = self.file_obj
        file.original_file_name = file_name
        file.file_name = file_generate_name(file_name)
        file.file_type = file_type
        file.uploaded_by = self.user
        file.upload_finished_at = timezone.now()

        file.full_clean()
        file.save()

        return file


class StartFileUploadData(TypedDict):
    file: File
    presigned_data: Dict[str, Any]


class StorageValidatedData(TypedDict):
    file_name: str
    file_type: str
    upload_finished_at: str
    created_by: User


class FileDirectUploadService:
 

    def __init__(self, user: User):
        self.user = user

    @transaction.atomic
    def start(self, data: StorageValidatedData) -> StartFileUploadData:
        original_file_name = data.get("original_file_name")
        file = File(
            original_file_name=original_file_name,
            file_name=file_generate_name(original_file_name),
            file_type=data.get("file_type"),
            created_by=data["user"],
            file=None,
        )

        file.full_clean()
        file.save()

        upload_path = file_generate_upload_path(file, file.file_name)

        """
        We are doing this in order to have an associated file for the field.
        """
        file.file = file.file.field.attr_class(
            file, file.file.field, upload_path
        )
        file.save()

        presigned_data: Dict[str, Any] = {}

        if settings.FILE_UPLOAD_STORAGE == FileUploadStorage.S3:
            presigned_data = s3_generate_presigned_post(
                file_path=upload_path, file_type=file.file_type
            )

        else:
            presigned_data = {
                "url": file_generate_local_upload_url(file_id=str(file.id)),
                'presigned_data': {}
            }

        return {
            "file": file,
            "presigned_data": presigned_data,
        }

    @transaction.atomic
    def finish(self, *, file: File) -> File:

        file.upload_finished_at = timezone.now()
        file.full_clean()
        file.save()

    @classmethod
    def cleanup_abandoned_uploads(cls):
        from datetime import timedelta
        from django.db import transaction
        threshold = timezone.now() - timedelta(hours=24)
        
        # Collect candidates
        abandoned_files = list(File.objects.filter(
            upload_finished_at__isnull=True,
            created_at__lt=threshold
        ))
        
        if not abandoned_files:
            return 0

        # Perform DB deletion in transaction
        with transaction.atomic():
            _, deleted_info = File.objects.filter(
                id__in=[f.id for f in abandoned_files],
                upload_finished_at__isnull=True  # Ensure we don't delete if it finished just now
            ).delete()
            
            count = deleted_info.get('storage.File', 0)
            
            # Safe storage cleanup ONLY after the transaction truly commits
            def _clean_blobs():
                for obj in abandoned_files:
                    if obj.file:
                        obj.file.delete(save=False)
                    if obj.thumbnail:
                        obj.thumbnail.delete(save=False)
            
            transaction.on_commit(_clean_blobs)
            
        return count

    @classmethod
    def cleanup_abandoned_uploads(cls):
        from datetime import timedelta
        from django.db import transaction
        threshold = timezone.now() - timedelta(hours=24)
        
        # Collect candidates
        abandoned_files = list(File.objects.filter(
            upload_finished_at__isnull=True,
            created_at__lt=threshold
        ))
        
        if not abandoned_files:
            return 0

        # Perform DB deletion in transaction
        with transaction.atomic():
            File.objects.filter(id__in=[f.id for f in abandoned_files]).delete()
        
        # Safe storage cleanup after DB commit
        count = 0
        for obj in abandoned_files:
            if obj.file:
                obj.file.delete(save=False)
            if obj.thumbnail:
                obj.thumbnail.delete(save=False)
            count += 1
            
        return count

    @transaction.atomic
    def upload_local(self, *, file: File, file_obj) -> File:
        _validate_file_size(file_obj)

        file.file = file_obj
        file.full_clean()
        file.save()

        return file
