from .models import Product

class ProductFilter(filters.FilterSet):

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price", "min_rating", "max_rating", "in_stock_only"]
