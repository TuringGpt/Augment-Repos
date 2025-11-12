from django.contrib import admin
from .models import ProductBrand, ProductCategory, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "price", "brand", "category", "created_by", "quantity", "rating"]
    list_filter = ["brand", "category", "created_by"]
    search_fields = ["name", "description", "brand__name", "category__name"]


@admin.register(ProductBrand)
class ProductBrandAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "created_by"]
    list_filter = ["created_by"]
    search_fields = ["name", "description"]


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "description", "parent", "created_by"]
    list_filter = ["parent", "created_by"]
    search_fields = ["name", "description"]
