import typing
import logging
import functools

logger = logging.getLogger(__name__)

from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import SAFE_METHODS
from rest_framework import filters

from accounts.permissions import hasAdminOrMerchantRole
from .models import Product, ProductBrand, ProductCategory
from .serializers import CreateProductBrandSerializer, CreateProductCategorySerializer, CreateProductSerializer, ProductBrandDetailSerializer, ProductBrandListSerializer, ProductCategoryDetailSerializer, ProductCategoryListSerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter, ProductSearchFilter
from .filters import ProductFilter, ProductSearchFilter
from .services import ProductCacheService, ProductCategoryCacheService, ProductService, ProductBrandCacheService, SearchService, ProductSearchCacheService
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
    from django.db.models.query import QuerySet
    from accounts.models import User


# Brand views

class BaseBrandView(AutoOptimizeMixin):
    """Base view for Brand related operations."""
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductBrandListSerializer
    queryset = ProductBrand.objects.all()
    auto_select_related = ['image', 'created_by']

    def get_queryset(self) -> "QuerySet[ProductBrand]":
        return super().get_queryset().order_by('name')
    
class ProductBrandListView(CachedListMixin, BaseBrandView, ListAPIView):
    cache_service_class = ProductBrandCacheService
    cache_ttl = 60 * 60  * 24



class CreateProductBrandView(CacheInvalidatorMixin, BaseBrandView, CreateAPIView):
    serializer_class = CreateProductBrandSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]
    cache_service_class = ProductBrandCacheService

    def invalidate_cache(self):
        super().invalidate_cache()
        ProductCacheService().clear_namespace()
        ProductSearchCacheService().clear_namespace()
        FeaturedProductCacheService().clear_namespace()

class ProductBrandDetailView(CacheInvalidatorMixin, BaseBrandView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductBrandDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]
    cache_service_class = ProductBrandCacheService

    def invalidate_cache(self):
        super().invalidate_cache()
        ProductCacheService().clear_namespace()
        ProductSearchCacheService().clear_namespace()
        FeaturedProductCacheService().clear_namespace()


# Category views

class BaseCategoryView(AutoOptimizeMixin):
    """Base view for Category related operations."""
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductCategoryListSerializer
    queryset = ProductCategory.objects.all()
    auto_select_related = ['image', 'created_by', 'parent']
    auto_prefetch_related = ['children']

    def get_queryset(self) -> "QuerySet[ProductCategory]":
        return super().get_queryset().order_by('name')
    
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
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated(), hasAdminOrMerchantRole()]


# Product views

class BaseProductView(AutoOptimizeMixin):
    """Base view for Product related operations with auto-optimization."""
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductListSerializer
    auto_select_related = ['brand', 'brand__image', 'category', 'category__image', 'created_by']
    auto_prefetch_related = ['images']
    queryset = Product.objects.all()

    def get_queryset(self) -> "QuerySet[Product]":
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


class FeaturedProductCacheService(ProductCacheService):
    OBJECT_NAME = "featured_products"
    VERSION = 1


class FeaturedProductListView(ProductListView):
    cache_service_class = FeaturedProductCacheService
    cache_ttl = 60 * 60

    def get_queryset(self):
        return super().get_queryset().filter(is_featured=True)


class ProductSearchView(CachedListMixin, AdvancedSearchMixin, BaseProductView, ListAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductSearchFilter
    search_fields = ["name", "description", "brand__name", "category__name"]
    cache_service_class = ProductSearchCacheService
    cache_ttl = 60 * 15

    def list(self, request, *args, **kwargs):
        query = (self.request.query_params.get('search') or "").strip()
        response = super().list(request, *args, **kwargs)
        
        if query and response.status_code == 200:
            # Handle results count for both paginated (dict) and unpaginated (list) responses
            if isinstance(response.data, dict):
                results_count = response.data.get('count', 0)
            elif isinstance(response.data, list):
                results_count = len(response.data)
            else:
                results_count = 0

            SearchService.log_search(
                query_string=query,
                results_count=results_count,
                user=self.request.user
            )
        return response

    def get_queryset(self):
        queryset = super().get_queryset()
        query = (self.request.query_params.get('search') or "").strip()
        
        search_filter = self.get_search_query_filter(query)
        queryset = queryset.filter(search_filter)
        
        return queryset


class CreateProductView(CacheInvalidatorMixin, BaseProductView, CreateAPIView):
    cache_service_class = ProductCacheService
    serializer_class = CreateProductSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

    def invalidate_cache(self):
        super().invalidate_cache()
        FeaturedProductCacheService().clear_namespace()


class ProductUpdateDeleteView(CacheInvalidatorMixin, BaseProductView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]
    cache_service_class = ProductCacheService

    def invalidate_cache(self):
        super().invalidate_cache()
        FeaturedProductCacheService().clear_namespace()

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAuthenticated(), hasAdminOrMerchantRole()]

    
    
class RecommendProductListView(BaseProductView, ListAPIView):
    def get_queryset(self):
        product_service = ProductService()
        return product_service.recommend_products_for_user(self.request.user)


from rest_framework import serializers

class ProductStockSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    in_stock = serializers.BooleanField()
    quantity = serializers.IntegerField()

class ProductStockView(RetrieveAPIView):
    """Check stock for a specific product."""
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProductStockSerializer
    
    def retrieve(self, request, *args, **kwargs):
        from rest_framework.response import Response
        instance = self.get_object()
        return Response({
            "product_id": instance.id,
            "in_stock": instance.quantity > 0,
            "quantity": instance.quantity
        })

