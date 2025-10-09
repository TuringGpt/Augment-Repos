
from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularSwaggerView
from django.urls import include



urlpatterns = [
    path('admin/', admin.site.urls),
    path('', SpectacularSwaggerView.as_view(url_name='v1:schema'), name='swagger-ui'),
    path('api/v1/', include('api.urls', namespace='v1')),
]
