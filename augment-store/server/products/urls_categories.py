from django.urls import path
from .views import ProductCategoryListView, CreateProductCategoryView, ProductCategoryDetailView

urlpatterns = [
    path('', ProductCategoryListView.as_view(), name='product_category_list'),
    path('create/', CreateProductCategoryView.as_view(), name='create_product_category'),
    path('<uuid:pk>/', ProductCategoryDetailView.as_view(), name='product_category_detail'),
]
