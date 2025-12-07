from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Sum, Avg, F, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from products.models import Product, ProductCategory
from checkout.models import Order, OrderItem, Payment
from carts.models import CartItem
from accounts.models import User
from .models import ProductStatistics, ProductView, CartAbandonment
from .serializers import (
    ProductStatisticsSerializer,
    ProductStatisticsSummarySerializer,
    CartAbandonmentSerializer,
)


def parse_int_param(value, default, min_value=1, max_value=None):
    """
    Safely parse an integer query parameter with validation.

    Args:
        value: The value to parse (typically from request.query_params)
        default: Default value if parsing fails or value is None
        min_value: Minimum allowed value (default: 1)
        max_value: Maximum allowed value (default: None for no limit)

    Returns:
        A validated integer value
    """
    if value is None:
        return default

    try:
        parsed = int(value)
        # Validate bounds
        if parsed < min_value:
            return default
        if max_value is not None and parsed > max_value:
            return max_value
        return parsed
    except (ValueError, TypeError):
        return default


class ProductStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for product statistics with multiple endpoints:
    - most_viewed: Products with highest view count within a time window
    - most_added_to_cart: Products most frequently added to cart
    - best_selling: Products with highest purchase count
    - frequently_abandoned: Products frequently abandoned in cart
    - general_statistics: Aggregated statistics across all products
    """
    queryset = ProductStatistics.objects.all()
    serializer_class = ProductStatisticsSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def most_viewed(self, request):
        """
        Get products sorted by view count within a time window (most viewed first).
        Query params:
        - limit: Number of products to return (default: 10, max: 100)
        - days: Number of days to look back (default: 30, max: 365)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)

        cutoff_date = timezone.now() - timedelta(days=days)

        # Count views from ProductView records within the time window, ordered by period-specific counts
        viewed_products = ProductView.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(
            period_view_count=Count('id')
        ).order_by('-period_view_count')[:limit]

        # Extract product IDs in the order they were ranked by period views
        product_ids = [item['product_id'] for item in viewed_products]

        # Fetch ProductStatistics in the same order as the period-specific ranking
        stats_dict = {stat.product_id: stat for stat in ProductStatistics.objects.filter(
            product_id__in=product_ids
        )}
        stats = [stats_dict[pid] for pid in product_ids if pid in stats_dict]

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
        - limit: Number of products to return (default: 10, max: 100)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)

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
        - limit: Number of products to return (default: 10, max: 100)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)

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
        - limit: Number of products to return (default: 10, max: 100)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)

        # Count abandonments per product, ordered by abandonment count
        abandoned_products = CartAbandonment.objects.values('product_id').annotate(
            abandonment_count=Count('id')
        ).order_by('-abandonment_count')[:limit]

        # Extract product IDs in the order they were ranked by abandonment count
        product_ids = [item['product_id'] for item in abandoned_products]

        # Fetch ProductStatistics in the same order as the abandonment ranking
        stats_dict = {stat.product_id: stat for stat in ProductStatistics.objects.filter(
            product_id__in=product_ids
        )}
        stats = [stats_dict[pid] for pid in product_ids if pid in stats_dict]

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
        stats_count = ProductStatistics.objects.count()

        return Response({
            'total_products_tracked': stats_count,
            'total_views': ProductStatistics.objects.aggregate(
                total=Sum('view_count')
            )['total'] or 0,
            'total_cart_additions': ProductStatistics.objects.aggregate(
                total=Sum('cart_add_count')
            )['total'] or 0,
            'total_purchases': ProductStatistics.objects.aggregate(
                total=Sum('purchase_count')
            )['total'] or 0,
        })

    @action(detail=False, methods=['get'])
    def analytics_overview(self, request):
        """
        Get comprehensive analytics overview for the dashboard.

        Query params:
        - days: Number of days to look back (default: 30, max: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - overview: Overview metrics (total_revenue, total_orders, completed_orders,
                    average_order_value, total_products, total_categories, new_customers)
        - conversion_funnel: Conversion metrics (total_views, total_cart_additions,
                             total_purchases, view_to_cart_rate, cart_to_purchase_rate,
                             overall_conversion_rate)
        - cart_abandonment: Abandonment metrics (total_abandonments, abandonment_rate)
        - top_products_by_revenue: List of top 5 products by revenue (product_id,
                                    product_name, revenue, units_sold, price)
        - category_performance: List of top 5 categories by revenue (category_name,
                                revenue, units_sold, orders)
        """
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        cutoff_date = timezone.now() - timedelta(days=days)

        # ===== OVERVIEW METRICS =====
        total_products = Product.objects.count()
        total_categories = ProductCategory.objects.count()
        total_users = User.objects.filter(date_joined__gte=cutoff_date).count()

        # Order metrics
        orders_in_period = Order.objects.filter(created_at__gte=cutoff_date)
        total_orders = orders_in_period.count()
        completed_orders = orders_in_period.filter(status=Order.OrderStatus.COMPLETED).count()

        # Revenue calculation (from completed orders)
        completed_order_items = OrderItem.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            product__isnull=False
        ).select_related('product')

        total_revenue = sum(
            (item.product.price * item.quantity) for item in completed_order_items
        ) if completed_order_items.exists() else Decimal('0.00')

        # Average order value
        avg_order_value = (total_revenue / completed_orders) if completed_orders > 0 else Decimal('0.00')

        # ===== CONVERSION FUNNEL =====
        total_views = ProductView.objects.filter(created_at__gte=cutoff_date).count()
        total_cart_adds = CartItem.objects.filter(created_at__gte=cutoff_date).count()
        # Count actual purchases (order items) in the time period from completed orders
        total_purchases = OrderItem.objects.filter(
            order__created_at__gte=cutoff_date,
            order__status=Order.OrderStatus.COMPLETED,
            product__isnull=False
        ).aggregate(total=Sum('quantity'))['total'] or 0

        # Conversion rates
        view_to_cart_rate = (total_cart_adds / total_views * 100) if total_views > 0 else 0
        cart_to_purchase_rate = (total_purchases / total_cart_adds * 100) if total_cart_adds > 0 else 0
        overall_conversion_rate = (total_purchases / total_views * 100) if total_views > 0 else 0

        # ===== CART ABANDONMENT =====
        total_abandonments = CartAbandonment.objects.filter(created_at__gte=cutoff_date).count()
        abandonment_rate = (total_abandonments / total_cart_adds * 100) if total_cart_adds > 0 else 0

        # ===== TOP PERFORMING PRODUCTS (by revenue) =====
        top_products_by_revenue = []
        product_revenue = {}

        for item in completed_order_items:
            product_id = str(item.product.id)
            revenue = item.product.price * item.quantity
            if product_id in product_revenue:
                product_revenue[product_id]['revenue'] += revenue
                product_revenue[product_id]['units_sold'] += item.quantity
            else:
                product_revenue[product_id] = {
                    'product_id': product_id,
                    'product_name': item.product.name,
                    'revenue': revenue,
                    'units_sold': item.quantity,
                    'price': item.product.price
                }

        # Sort by revenue and get top 5
        sorted_products = sorted(
            product_revenue.values(),
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]

        top_products_by_revenue = [
            {
                'product_id': p['product_id'],
                'product_name': p['product_name'],
                'revenue': float(p['revenue']),
                'units_sold': p['units_sold'],
                'price': float(p['price'])
            }
            for p in sorted_products
        ]

        # ===== CATEGORY PERFORMANCE =====
        category_stats = {}
        for item in completed_order_items:
            category_name = item.product.category.name
            revenue = item.product.price * item.quantity

            if category_name in category_stats:
                category_stats[category_name]['revenue'] += revenue
                category_stats[category_name]['units_sold'] += item.quantity
                category_stats[category_name]['order_ids'].add(item.order_id)
            else:
                category_stats[category_name] = {
                    'category_name': category_name,
                    'revenue': revenue,
                    'units_sold': item.quantity,
                    'order_ids': {item.order_id}  # Track unique order IDs
                }

        # Sort by revenue
        sorted_categories = sorted(
            category_stats.values(),
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]

        category_performance = [
            {
                'category_name': c['category_name'],
                'revenue': float(c['revenue']),
                'units_sold': c['units_sold'],
                'orders': len(c['order_ids'])  # Count distinct orders
            }
            for c in sorted_categories
        ]

        # ===== RESPONSE =====
        return Response({
            'period_days': days,
            'overview': {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'average_order_value': float(avg_order_value),
                'total_products': total_products,
                'total_categories': total_categories,
                'new_customers': total_users,
            },
            'conversion_funnel': {
                'total_views': total_views,
                'total_cart_additions': total_cart_adds,
                'total_purchases': total_purchases,
                'view_to_cart_rate': round(view_to_cart_rate, 2),
                'cart_to_purchase_rate': round(cart_to_purchase_rate, 2),
                'overall_conversion_rate': round(overall_conversion_rate, 2),
            },
            'cart_abandonment': {
                'total_abandonments': total_abandonments,
                'abandonment_rate': round(abandonment_rate, 2),
            },
            'top_products_by_revenue': top_products_by_revenue,
            'category_performance': category_performance,
        })


    @action(detail=False, methods=['get'])
    def product_performance(self, request):
        """
        Get detailed product performance metrics for all products.

        Query params:
        - limit: Number of products to return per category (default: 10, max: 100)
        - days: Number of days to look back (default: 30, max: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - low_performing_products: Products with lowest purchase count (product_id,
                                   product_name, view_count, cart_add_count, purchase_count,
                                   view_to_purchase_ratio, cart_to_purchase_ratio)
        - high_abandonment_products: Products with highest cart abandonment rate (product_id,
                                     product_name, cart_add_count, abandonment_count,
                                     abandonment_rate)
        - low_conversion_products: Products with lowest conversion rate (product_id,
                                   product_name, view_count, purchase_count, conversion_rate)
        - high_engagement_products: Products with high view-to-purchase ratio (product_id,
                                    product_name, view_count, purchase_count, engagement_ratio)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        cutoff_date = timezone.now() - timedelta(days=days)

        # ===== LOW PERFORMING PRODUCTS (lowest purchase count) =====
        low_performing = ProductStatistics.objects.filter(
            purchase_count__gt=0
        ).order_by('purchase_count')[:limit]

        low_performing_data = []
        for stat in low_performing:
            view_to_purchase = (stat.view_count / stat.purchase_count) if stat.purchase_count > 0 else 0
            cart_to_purchase = (stat.cart_add_count / stat.purchase_count) if stat.purchase_count > 0 else 0
            low_performing_data.append({
                'product_id': str(stat.product.id),
                'product_name': stat.product.name,
                'view_count': stat.view_count,
                'cart_add_count': stat.cart_add_count,
                'purchase_count': stat.purchase_count,
                'view_to_purchase_ratio': round(view_to_purchase, 2),
                'cart_to_purchase_ratio': round(cart_to_purchase, 2),
            })

        # ===== HIGH ABANDONMENT PRODUCTS =====
        abandonment_stats = CartAbandonment.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(
            abandonment_count=Count('id')
        ).order_by('-abandonment_count')[:limit]

        high_abandonment_data = []
        for item in abandonment_stats:
            product_id = item['product_id']
            abandonment_count = item['abandonment_count']

            try:
                stat = ProductStatistics.objects.get(product_id=product_id)
                abandonment_rate = (abandonment_count / stat.cart_add_count * 100) if stat.cart_add_count > 0 else 0
                high_abandonment_data.append({
                    'product_id': str(stat.product.id),
                    'product_name': stat.product.name,
                    'cart_add_count': stat.cart_add_count,
                    'abandonment_count': abandonment_count,
                    'abandonment_rate': round(abandonment_rate, 2),
                })
            except ProductStatistics.DoesNotExist:
                continue

        # ===== LOW CONVERSION PRODUCTS =====
        # Get all products with views and calculate conversion rate
        all_products_with_views = ProductStatistics.objects.filter(
            view_count__gt=0
        )

        # Calculate conversion rates and sort by lowest conversion rate
        products_with_conversion = []
        for stat in all_products_with_views:
            conversion_rate = (stat.purchase_count / stat.view_count * 100) if stat.view_count > 0 else 0
            products_with_conversion.append({
                'stat': stat,
                'conversion_rate': conversion_rate,
            })

        # Sort by conversion rate (ascending) and take top limit
        products_with_conversion.sort(key=lambda x: x['conversion_rate'])
        low_conversion = products_with_conversion[:limit]

        low_conversion_data = []
        for item in low_conversion:
            stat = item['stat']
            conversion_rate = item['conversion_rate']
            low_conversion_data.append({
                'product_id': str(stat.product.id),
                'product_name': stat.product.name,
                'view_count': stat.view_count,
                'purchase_count': stat.purchase_count,
                'conversion_rate': round(conversion_rate, 2),
            })

        # ===== HIGH ENGAGEMENT PRODUCTS (high view-to-purchase ratio) =====
        # Get all products with both views and purchases
        all_products_with_engagement = ProductStatistics.objects.filter(
            view_count__gt=0,
            purchase_count__gt=0
        )

        # Calculate engagement ratio and sort by highest ratio
        products_with_engagement = []
        for stat in all_products_with_engagement:
            engagement_ratio = (stat.view_count / stat.purchase_count) if stat.purchase_count > 0 else 0
            products_with_engagement.append({
                'stat': stat,
                'engagement_ratio': engagement_ratio,
            })

        # Sort by engagement ratio (descending) and take top limit
        products_with_engagement.sort(key=lambda x: x['engagement_ratio'], reverse=True)
        high_engagement = products_with_engagement[:limit]

        high_engagement_data = []
        for item in high_engagement:
            stat = item['stat']
            engagement_ratio = item['engagement_ratio']
            high_engagement_data.append({
                'product_id': str(stat.product.id),
                'product_name': stat.product.name,
                'view_count': stat.view_count,
                'purchase_count': stat.purchase_count,
                'engagement_ratio': round(engagement_ratio, 2),
            })

        # ===== RESPONSE =====
        return Response({
            'period_days': days,
            'low_performing_products': low_performing_data,
            'high_abandonment_products': high_abandonment_data,
            'low_conversion_products': low_conversion_data,
            'high_engagement_products': high_engagement_data,
        })
