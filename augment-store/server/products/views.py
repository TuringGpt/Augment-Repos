import typing
import logging
import functools

logger = logging.getLogger(__name__)

from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import SAFE_METHODS
from rest_framework import filters

from accounts.permissions import hasAdminOrMerchantRole
from .models import Product, ProductBrand, ProductCategory
from .serializers import CreateProductBrandSerializer, CreateProductCategorySerializer, CreateProductSerializer, ProductBrandDetailSerializer, ProductBrandListSerializer, ProductCategoryDetailSerializer, ProductCategoryListSerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter, ProductSearchFilter
from .filters import ProductFilter, ProductSearchFilter
from .services import ProductCacheService, ProductCategoryCacheService, ProductService, ProductBrandCacheService
from core.service import CacheInvalidatorMixin, CachedListMixin
from core.optimization import AutoOptimizeMixin
from core.search import AdvancedSearchMixin

def track_search_query(func):
    """
    Decorator to track search queries.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        request = args[1] if len(args) > 1 else None
        if request:
            # Avoid logging PII/raw terms in production
            logger.info("Search query processing started")
        return func(*args, **kwargs)
    return wrapper


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
        # Optimization: use prefetch_related for MPTT children
        return ProductCategory.objects.all().order_by('name').select_related('image', 'created_by', 'parent').prefetch_related('children')
    
    def get_recursive_categories(self, category_id):
        """
        Fetch recursive category tree.
        """
        try:
            instance = ProductCategory.objects.get(id=category_id)
            # Safe access to image URL
            image_url = instance.image.url if instance.image else None
            if image_url:
                logger.debug("Category tree accessed")
            return instance.get_descendants(include_self=True)
        except (ProductCategory.DoesNotExist, ValueError, TypeError):
            return ProductCategory.objects.none()

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

class BaseProductView(AutoOptimizeMixin):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductListSerializer
    auto_select_related = ['brand', 'category', 'created_by']
    auto_prefetch_related = ['images']
    queryset = Product.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        user: "User" = self.request.user
        
        if (self.request.method in SAFE_METHODS) or user.is_admin:
            return queryset
    
        return queryset.filter(created_by=user)

class ProductListView( CachedListMixin, BaseProductView, ListAPIView):
    cache_service_class = ProductCacheService
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = ProductFilter

    ordering_fields = ["created_at", "price", "rating", "quantity", "category",  "category__name", "brand", "brand__name"]
    search_fields = ["name", "description", "brand__name", "category__name"]

class FeaturedProductListView(ProductListView):

    def get_queryset(self):
        return Product.objects.filter(is_featured=True).select_related('brand', 'category', 'created_by').prefetch_related('images')

class ProductSearchView(AdvancedSearchMixin, BaseProductView, ListAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductSearchFilter
    search_fields = ["name", "description", "brand__name", "category__name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get('search')
        search_filter = self.get_search_query_filter(self.request.query_params)
        return queryset.filter(search_filter)

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
