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
from .services import ProductService




if typing.TYPE_CHECKING:
    from accounts.models import User


# Brand views

class BaseBrandView:
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductBrandListSerializer

    def get_queryset(self):
        return ProductBrand.objects.all().order_by('name')
    
class ProductBrandListView(BaseBrandView, ListAPIView):
    pass

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
        return ProductCategory.objects.all().order_by('name')
    
class ProductCategoryListView(BaseCategoryView, ListAPIView):
    pass


class CreateProductCategoryView(BaseCategoryView, CreateAPIView):
    serializer_class = CreateProductCategorySerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

class ProductCategoryDetailView(BaseCategoryView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductCategoryDetailSerializer

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
        
        if self.request.method in SAFE_METHODS or user.is_admin:
            return Product.objects.all()
    
        return Product.objects.get_user_products(user)

class ProductListView(BaseProductView, ListAPIView):
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = ProductFilter

    ordering_fields = ["created_at", "price", "rating", "quantity", "category",  "category__name", "brand", "brand__name"]
    search_fields = ["name", "description", "brand__name", "category__name"]

class FeaturedProductListView(ProductListView):

    def get_queryset(self):
        return Product.objects.filter(is_featured=True)

class ProductSearchView(BaseProductView, ListAPIView):
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_class = ProductSearchFilter
    search_fields = ["name", "description", "brand__name", "category__name"]

    def get_queryset(self):
        return Product.objects.all()

class CreateProductView(BaseProductView, CreateAPIView):
    serializer_class = CreateProductSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

class ProductUpdateDeleteView(BaseProductView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

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






