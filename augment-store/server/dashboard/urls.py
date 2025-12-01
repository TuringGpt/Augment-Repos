from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductStatisticsViewSet

router = DefaultRouter()
router.register(r'statistics', ProductStatisticsViewSet, basename='product-statistics')

urlpatterns = [
    path('', include(router.urls)),
]
