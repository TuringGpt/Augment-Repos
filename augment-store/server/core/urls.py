
from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularSwaggerView
from django.urls import include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', SpectacularSwaggerView.as_view(url_name='v1:schema'), name='swagger-ui'),
    path('api/v1/', include('api.urls', namespace='v1')),
]

# Serve media files in development mode when using local storage
if settings.DEBUG and settings.FILE_UPLOAD_STORAGE == "local":
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
