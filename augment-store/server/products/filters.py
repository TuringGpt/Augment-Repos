from django_filters import rest_framework as filters

from .models import Product

class ProductFilter(filters.FilterSet):
    """
    FilterSet for product-related queries.
    """

    rating = filters.RangeFilter()
    price = filters.RangeFilter()
    category = filters.CharFilter(field_name="category__slug")
    brand = filters.CharFilter(field_name="brand__name", lookup_expr='iexact')
    quantity = filters.RangeFilter()
    limit = filters.NumberFilter(field_name="limit", method="filter_limit", max_value=100, min_value=1)

    class Meta:
        model = Product
        fields = ["category", "brand", "rating", "price", "quantity" ]


    def filter_limit(self, queryset, name, value):
        self._limit_value = value
        return queryset

    @property
    def qs(self):
        queryset = super().qs
        limit_value = getattr(self, "_limit_value", None)
        if limit_value:
            queryset = queryset[:limit_value]
        return queryset

class ProductSearchFilter(filters.FilterSet):
    limit = filters.NumberFilter(field_name="limit", method="limit_filter", max_value=100, min_value=1)

    def limit_filter(self, queryset, name, value):
        return queryset[:value]
