import typing

from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import SAFE_METHODS
from rest_framework import filters

from accounts.permissions import hasAdminOrMerchantRole
from .models import Product, ProductBrand, ProductCategory
from .serializers import CreateProductBrandSerializer, CreateProductCategorySerializer, CreateProductSerializer, ProductBrandDetailSerializer, ProductBrandListSerializer, ProductCategoryDetailSerializer, ProductCategoryListSerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter, ProductSearchFilter
from .services import ProductCacheService, ProductCategoryCacheService, ProductService, ProductBrandCacheService
from core.service import CacheInvalidatorMixin, CachedListMixin
if typing.TYPE_CHECKING:
    from accounts.models import User


# Brand views

class BaseBrandView:
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductBrandListSerializer

    def get_queryset(self):
        return ProductBrand.objects.all().order_by('name').select_related('image', 'created_by',)
    
class ProductBrandListView(CachedListMixin, BaseBrandView, ListAPIView):
    cache_service_class = ProductBrandCacheService
    cache_ttl = 60 * 60  * 24



class CreateProductBrandView(BaseBrandView, CreateAPIView):
    serializer_class = CreateProductBrandSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

class ProductBrandDetailView(BaseBrandView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductBrandDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]


# Category views

class BaseCategoryView:
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductCategoryListSerializer

    def get_queryset(self):
        return ProductCategory.objects.all().order_by('name').select_related('image', 'created_by', 'parent')
    
class ProductCategoryListView(CachedListMixin, BaseCategoryView, ListAPIView):
    cache_service_class = ProductCategoryCacheService
    cache_ttl = 60 * 60  * 24


class CreateProductCategoryView(CacheInvalidatorMixin, BaseCategoryView, CreateAPIView):
    serializer_class = CreateProductCategorySerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]
    cache_service_class = ProductCategoryCacheService

class ProductCategoryDetailView(CacheInvalidatorMixin, BaseCategoryView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductCategoryDetailSerializer
    cache_service_class = ProductCategoryCacheService

    def get_permissions(self):
        super().get_permissions()
        if self.request.method == "GET":
            return [IsAuthenticatedOrReadOnly()]
        
        return [IsAuthenticatedOrReadOnly(), hasAdminOrMerchantRole()]


# Product views

class BaseProductView:
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        user: "User" = self.request.user
        
        if (self.request.method in SAFE_METHODS) or user.is_admin:
            return Product.objects.all().select_related('brand', 'category', 'created_by').prefetch_related('images')
    
        return Product.objects.get_user_products(user).select_related('brand', 'category', 'created_by').prefetch_related('images')

class ProductListView( CachedListMixin, BaseProductView, ListAPIView):
    cache_service_class = ProductCacheService
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = ProductFilter

    ordering_fields = ["created_at", "price", "rating", "quantity", "category",  "category__name", "brand", "brand__name"]
    search_fields = ["name", "description", "brand__name", "category__name"]

class FeaturedProductListView(ProductListView):

    def get_queryset(self):
        return Product.objects.filter(is_featured=True).select_related('brand', 'category', 'created_by').prefetch_related('images')

class ProductSearchView(BaseProductView, ListAPIView):
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_class = ProductSearchFilter
    search_fields = ["name", "description", "brand__name", "category__name"]

    def get_queryset(self):
        return Product.objects.all().select_related('brand', 'category', 'created_by').prefetch_related('images')

class CreateProductView(CacheInvalidatorMixin, BaseProductView, CreateAPIView):
    cache_service_class = ProductCacheService
    serializer_class = CreateProductSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

class ProductUpdateDeleteView(CacheInvalidatorMixin, BaseProductView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]
    cache_service_class = ProductCacheService

    def get_permissions(self):
        super().get_permissions()
        if self.request.method == "GET":
            return [IsAuthenticatedOrReadOnly()]
        
        return [IsAuthenticated(), hasAdminOrMerchantRole()]
    

class RecommendProductListView(BaseProductView, ListAPIView):
    def get_queryset(self):
        user: "User" = self.request.user
        product_service = ProductService()
        return product_service.recommend_products_for_user(user)
