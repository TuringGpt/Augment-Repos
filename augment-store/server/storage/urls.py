from django.urls import path

from .views import StartDirectFileUpload, FinishDirectFileUploadFinish


app_name = "storage"
urlpatterns = [
    path("direct/", StartDirectFileUpload.as_view(), name="start_direct_upload"),
    path(
        "direct/finish/",
        FinishDirectFileUploadFinish.as_view(),
        name="finish_direct_upload",
    ),
]
