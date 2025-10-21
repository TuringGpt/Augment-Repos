import typing

from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import hasAdminOrMerchantRole
from .models import Product, ProductBrand, ProductCategory
from .serializers import CreateProductBrandSerializer, CreateProductCategorySerializer, CreateProductSerializer, ProductBrandDetailSerializer, ProductBrandListSerializer, ProductCategoryDetailSerializer, ProductCategoryListSerializer, ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter



if typing.TYPE_CHECKING:
    from accounts.models import User


# Brand views

class BaseBrandView:
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductBrandListSerializer

    def get_queryset(self):
        return ProductBrand.objects.all()
    
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
        return ProductCategory.objects.all()
    
class ProductCategoryListView(BaseCategoryView, ListAPIView):
    pass


class CreateProductCategoryView(BaseCategoryView, CreateAPIView):
    serializer_class = CreateProductCategorySerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

class ProductCategoryDetailView(BaseCategoryView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductCategoryDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]


# Product views

class BaseProductView:
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Product.objects.all()

class ProductListView(BaseProductView, ListAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

    ordering_fields = ["created_at", "price", "rating", "quantity", "category__name1"]
    search_fields = ["name", "descriptin", "brand__name", "category__name"]


class CreateProductView(BaseProductView, CreateAPIView):
    serializer_class = CreateProductSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

class ProductUpdateDeleteView(BaseProductView, RetrieveUpdateDestroyAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated, hasAdminOrMerchantRole]

    def get_queryset(self):
        user: "User" = self.request.user
        if user.is_admin:
            return Product.objects.all()
    
        return Product.objects.get_user_products(user)
    








