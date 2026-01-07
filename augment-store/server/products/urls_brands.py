from django.urls import path

from .views import CreateProductBrandView, ProductBrandDetailView, ProductBrandListView

urlpatterns = [
    path('', ProductBrandListView.as_view(), name='product_brand_list'),
    path('create/', CreateProductBrandView.as_view(), name='create_product_brand'),
    path('<uuid:pk>/', ProductBrandDetailView.as_view(), name='product_brand_detail'),
]
