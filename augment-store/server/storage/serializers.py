from typing import List

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from storage.services import FileDirectUploadService, StorageValidatedData

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
        if not obj.file: return None

        if settings.FILE_UPLOAD_STORAGE == FileUploadStorage.LOCAL:
            return obj.file.url

        # For S3, use the direct URL since PublicMediaStorage makes files public
        return obj.file.url

class FileListSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ["id", "file"]

    def get_file(self, obj: File):
        from core.service import BaseCacheService
        if not obj.file: return None
        service = BaseCacheService()
        cache_key = service.get_cache_key(custom_key=f"file_meta:{obj.id}:{obj.file.name}")
        
        data = service.get(cache_key)
        if data is None:
            data = obj.file.url
            service.set(cache_key, data, ttl=3600) 
            
        return data


class StartDirectFileUploadSerializer( serializers.Serializer):

    original_file_name = serializers.CharField(write_only=True)
    file_type = serializers.CharField(write_only=True)
    file = serializers.SerializerMethodField()
    presigned_data = serializers.SerializerMethodField()


    def create(self, validated_data: StorageValidatedData):

        user = self.context["request"].user
        validated_data["user"] = user
        service = FileDirectUploadService(user)
        data = service.start(validated_data)

        return data

    def get_file(self, obj):
        file = obj.get("file")
        if not file: return None
        return FileSerializer(file).data

    def get_presigned_data(self, obj):
        return obj.get("presigned_data")

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
        return {"file": file, "file_id": file_id,}

class FinishFileUploadSerializer(serializers.Serializer):
    file_id = serializers.CharField(write_only=True)
    file = serializers.SerializerMethodField()

    def create(self, validated_data):
        user = self.context["request"].user
        file_id = validated_data["file_id"]

        file = get_object_or_404(File, id=file_id)

        service = FileDirectUploadService(user)
        file = service.finish(file=file)
        return {"file": file, "file_id": file_id,}

    def get_file(self, obj: File):
        file = obj.get("file")
        if not file: return
        return FileSerializer(file).data


