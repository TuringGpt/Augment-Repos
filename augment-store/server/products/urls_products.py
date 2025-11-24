from django.urls import path
from .views import (ProductListView, 
                    CreateProductView, 
                    ProductUpdateDeleteView, 
                    ProductSearchView,
                    FeaturedProductListView,
                    RecommendProductListView
                )

urlpatterns = [
    path('', ProductListView.as_view(), name='product_list'),
    path('create/', CreateProductView.as_view(), name='create_product'),
    path('<uuid:pk>/', ProductUpdateDeleteView.as_view(), name='product_update_delete'),
    path('search/', ProductSearchView.as_view(), name='product_search'),
    path('featured/', FeaturedProductListView.as_view(), name='product_featured'),
    path('recommend/', RecommendProductListView.as_view(), name='product_recommend'),

]
