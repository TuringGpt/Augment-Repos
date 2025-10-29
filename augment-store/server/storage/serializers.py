from typing import List

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from storage.services import FileDirectUploadService, StorageValidatedData
from .utils import create_presigned_url

from .models import File
from .enums import FileUploadStorage


class FileSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = File
        exclude = ("is_deleted",)
        read_only_fields = (
            "id",
            "upload_finished_at",
            "created_by",
        )

    def get_file(self, obj: File):
        if not obj.file:
            return None

        if settings.FILE_UPLOAD_STORAGE == FileUploadStorage.LOCAL:
            return obj.file.url

        return create_presigned_url(obj.file.name)


class StartDirectFileUploadSerializer(serializers.Serializer):

    original_file_name = serializers.CharField(write_only=True)
    file_type = serializers.CharField(write_only=True)

    def create(self, validated_data: StorageValidatedData):

        user = self.context["request"].user
        validated_data["user"] = user
        service = FileDirectUploadService(user)
        data = service.start(validated_data)

        return data


class DirectLocalFileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(write_only=True)
    file_id = serializers.CharField(write_only=True)

    def create(self, validated_data):
        user = self.context["request"].user
        file_id = validated_data["file_id"]
        file_obj = validated_data["file"]

        file = get_object_or_404(File, id=file_id)

        service = FileDirectUploadService(user)
        file = service.upload_local(file=file, file_obj=file_obj)
        return {"file": file, "file_id": file_id}


class FinishFileUploadSerializer(serializers.Serializer):
    file_id = serializers.CharField(write_only=True)
    file = serializers.SerializerMethodField()

    def create(self, validated_data):
        user = self.context["request"].user
        file_id = validated_data["file_id"]

        file = get_object_or_404(File, id=file_id)

        service = FileDirectUploadService(user)
        file = service.finish(file=file)
        return {
            "file": file,
            "file_id": file_id,
        }

    def get_file(self, obj):
        """
        Return the file URL as a string instead of the full file object
        """
        file = obj.get("file")
        if not file:
            return None

        # Return the file URL as a string
        if not file.file:
            return None

        if settings.FILE_UPLOAD_STORAGE == FileUploadStorage.LOCAL:
            return file.file.url

        return create_presigned_url(file.file.name)
