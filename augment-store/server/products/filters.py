from django_filters import rest_framework as filters

from .models import Product

class ProductFilter(filters.FilterSet):

    rating = filters.RangeFilter()
    price = filters.RangeFilter()
    category = filters.CharFilter(field_name="category__slug")
    brand = filters.CharFilter(field_name="brand__name")
    quantity = filters.RangeFilter()
    class Meta:
        model = Product
        fields = ["category", "brand", "rating", "price", "quantity" ]
