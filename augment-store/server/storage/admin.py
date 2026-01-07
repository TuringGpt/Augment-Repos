from django.contrib import admin

from .models import File


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ["original_file_name", "file_name", "file_type", "created_by", "upload_finished_at"]
    list_filter = ["created_by", "upload_finished_at"]
    search_fields = ["original_file_name", "file_name", "file_type"]
