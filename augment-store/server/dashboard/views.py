from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from products.models import Product
from .models import ProductStatistics, ProductView, CartAbandonment
from .serializers import (
    ProductStatisticsSerializer,
    ProductStatisticsSummarySerializer,
    CartAbandonmentSerializer,
)


class ProductStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for product statistics with multiple endpoints:
    - most_viewed: Products with highest view count
    - most_added_to_cart: Products most frequently added to cart
    - best_selling: Products with highest purchase count
    - frequently_abandoned: Products frequently abandoned in cart
    - general_statistics: Overall statistics for a specific product
    """
    queryset = ProductStatistics.objects.all()
    serializer_class = ProductStatisticsSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def most_viewed(self, request):
        """
        Get products sorted by view count (most viewed first).
        Query params:
        - limit: Number of products to return (default: 10)
        - days: Number of days to look back (default: 30)
        """
        limit = int(request.query_params.get('limit', 10))
        days = int(request.query_params.get('days', 30))

        cutoff_date = timezone.now() - timedelta(days=days)

        stats = ProductStatistics.objects.filter(
            view_count__gt=0
        ).order_by('-view_count')[:limit]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'view_count',
            'period_days': days,
        })

    @action(detail=False, methods=['get'])
    def most_added_to_cart(self, request):
        """
        Get products most frequently added to cart.
        Query params:
        - limit: Number of products to return (default: 10)
        """
        limit = int(request.query_params.get('limit', 10))

        stats = ProductStatistics.objects.filter(
            cart_add_count__gt=0
        ).order_by('-cart_add_count')[:limit]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'cart_add_count',
        })

    @action(detail=False, methods=['get'])
    def best_selling(self, request):
        """
        Get best-selling products (highest purchase count).
        Query params:
        - limit: Number of products to return (default: 10)
        """
        limit = int(request.query_params.get('limit', 10))

        stats = ProductStatistics.objects.filter(
            purchase_count__gt=0
        ).order_by('-purchase_count')[:limit]

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'purchase_count',
        })

    @action(detail=False, methods=['get'])
    def frequently_abandoned(self, request):
        """
        Get products frequently abandoned in cart.
        Query params:
        - limit: Number of products to return (default: 10)
        """
        limit = int(request.query_params.get('limit', 10))

        # Count abandonments per product
        abandoned_products = CartAbandonment.objects.values('product_id').annotate(
            abandonment_count=Count('id')
        ).order_by('-abandonment_count')[:limit]

        product_ids = [item['product_id'] for item in abandoned_products]
        stats = ProductStatistics.objects.filter(
            product_id__in=product_ids
        ).order_by('-cart_remove_count')

        serializer = ProductStatisticsSerializer(stats, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'metric': 'cart_remove_count',
        })

    @action(detail=False, methods=['get'])
    def general_statistics(self, request):
        """
        Get general statistics for all products.
        Returns aggregated metrics.
        """
        total_stats = ProductStatistics.objects.aggregate(
            total_views=Count('view_count'),
            total_cart_additions=Count('cart_add_count'),
            total_purchases=Count('purchase_count'),
            avg_views=Count('view_count'),
            avg_cart_additions=Count('cart_add_count'),
            avg_purchases=Count('purchase_count'),
        )

        stats_count = ProductStatistics.objects.count()

        return Response({
            'total_products_tracked': stats_count,
            'total_views': ProductStatistics.objects.aggregate(
                total=Count('view_count')
            )['total'] or 0,
            'total_cart_additions': ProductStatistics.objects.aggregate(
                total=Count('cart_add_count')
            )['total'] or 0,
            'total_purchases': ProductStatistics.objects.aggregate(
                total=Count('purchase_count')
            )['total'] or 0,
        })
 