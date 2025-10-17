from django.urls import path

from .views import StartDirectFileUpload, DirectLocalFileUpload, FinishDirectFileUploadFinish


app_name = "storage"
urlpatterns = [
    path('direct/', StartDirectFileUpload.as_view(), name='start_direct_upload'),
    path('direct/local/<str:file_id>/', DirectLocalFileUpload.as_view(), name='direct_local_upload'),
    path('direct/finish/', FinishDirectFileUploadFinish.as_view(), name='finish_direct_upload'),
]
