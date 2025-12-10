from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Sum, Avg, F, DecimalField, Min, Max
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from collections import defaultdict

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
    ViewSet for product and customer analytics with multiple endpoints:

    Product Analytics:
    - most_viewed: Products with highest view count within a time window
    - most_added_to_cart: Products most frequently added to cart
    - best_selling: Products with highest purchase count
    - frequently_abandoned: Products frequently abandoned in cart
    - general_statistics: Aggregated statistics across all products
    - analytics_overview: Comprehensive dashboard overview
    - product_performance: Detailed product performance metrics

    Customer Analytics:
    - customer_lifetime_value: Top customers by revenue and value tier
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
        Get detailed product performance metrics for all products within a specified time period.

        All metrics are calculated based on data from the last N days (specified by the 'days' parameter).

        Query params:
        - limit: Maximum number of products to return for each metric (default: 10, max: 100)
        - days: Number of days to look back (default: 30, max: 365)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - low_performing_products: Top products with lowest purchase count within period (product_id,
                                   product_name, view_count, cart_add_count, purchase_count,
                                   view_to_purchase_ratio, cart_to_purchase_ratio)
        - high_abandonment_products: Top products with highest cart abandonment rate within period (product_id,
                                     product_name, cart_add_count, abandonment_count,
                                     abandonment_rate)
        - low_conversion_products: Top products with lowest conversion rate within period (product_id,
                                   product_name, view_count, purchase_count, conversion_rate)
        - high_engagement_products: Top products with highest view-to-purchase ratio within period (product_id,
                                    product_name, view_count, purchase_count, engagement_ratio)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=10, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=30, max_value=365)
        cutoff_date = timezone.now() - timedelta(days=days)

        # ===== COMPUTE PERIOD-SPECIFIC DATA UPFRONT =====
        # Get all views within the time window
        views_by_product = {}
        for item in ProductView.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(view_count=Count('id')):
            views_by_product[item['product_id']] = item['view_count']

        # Get all purchases within the time window
        purchases_by_product = {}
        for item in OrderItem.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(purchase_count=Count('id')):
            purchases_by_product[item['product_id']] = item['purchase_count']

        # Get all abandonments within the time window
        abandonments_by_product = {}
        for item in CartAbandonment.objects.filter(
            created_at__gte=cutoff_date
        ).values('product_id').annotate(abandonment_count=Count('id')):
            abandonments_by_product[item['product_id']] = item['abandonment_count']

        # ===== LOW PERFORMING PRODUCTS (lowest purchase count within period) =====
        # Get cart additions within the time window
        # Note: We calculate cart additions in period as: purchases + abandonments
        cart_adds_by_product = {}
        for product_id in set(list(purchases_by_product.keys()) + list(abandonments_by_product.keys())):
            cart_adds_by_product[product_id] = purchases_by_product.get(product_id, 0) + abandonments_by_product.get(product_id, 0)

        # Build low performing products list including products with zero purchases
        # Include all products that have views or cart additions in the period
        products_with_activity = set(list(views_by_product.keys()) + list(cart_adds_by_product.keys()))

        low_performing_list = []
        for product_id in products_with_activity:
            purchase_count = purchases_by_product.get(product_id, 0)
            view_count = views_by_product.get(product_id, 0)
            cart_add_count = cart_adds_by_product.get(product_id, 0)

            # Only include products with some activity (views or cart additions)
            if view_count > 0 or cart_add_count > 0:
                low_performing_list.append({
                    'product_id': product_id,
                    'view_count': view_count,
                    'cart_add_count': cart_add_count,
                    'purchase_count': purchase_count,
                })

        # Sort by purchase count (ascending) to get lowest performing first
        low_performing_list.sort(key=lambda x: x['purchase_count'])

        # Build response data for top limit items
        low_performing_data = []
        for item in low_performing_list[:limit]:
            try:
                product = Product.objects.get(id=item['product_id'])
                view_count = item['view_count']
                cart_add_count = item['cart_add_count']
                purchase_count = item['purchase_count']

                view_to_purchase = (view_count / purchase_count) if purchase_count > 0 else 0
                cart_to_purchase = (cart_add_count / purchase_count) if purchase_count > 0 else 0

                low_performing_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'view_count': view_count,
                    'cart_add_count': cart_add_count,
                    'purchase_count': purchase_count,
                    'view_to_purchase_ratio': round(view_to_purchase, 2),
                    'cart_to_purchase_ratio': round(cart_to_purchase, 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== HIGH ABANDONMENT PRODUCTS (within period) =====
        # Calculate abandonment rates and sort by rate (descending)
        products_with_abandonment = []
        for product_id, abandonment_count in abandonments_by_product.items():
            purchases_in_period = purchases_by_product.get(product_id, 0)
            period_cart_adds = purchases_in_period + abandonment_count
            abandonment_rate = (abandonment_count / period_cart_adds * 100) if period_cart_adds > 0 else 0
            products_with_abandonment.append((product_id, abandonment_count, period_cart_adds, abandonment_rate))

        # Sort by abandonment_rate (descending), then by abandonment_count (descending) as tiebreaker
        products_with_abandonment.sort(key=lambda x: (x[3], x[1]), reverse=True)

        high_abandonment_data = []
        for product_id, abandonment_count, period_cart_adds, abandonment_rate in products_with_abandonment[:limit]:
            try:
                product = Product.objects.get(id=product_id)
                high_abandonment_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'cart_add_count': period_cart_adds,
                    'abandonment_count': abandonment_count,
                    'abandonment_rate': round(abandonment_rate, 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== LOW CONVERSION PRODUCTS (within period) =====
        # Calculate conversion rates for products with views
        products_with_conversion = []
        for product_id, view_count in views_by_product.items():
            purchase_count = purchases_by_product.get(product_id, 0)
            conversion_rate = (purchase_count / view_count * 100) if view_count > 0 else 0
            products_with_conversion.append({
                'product_id': product_id,
                'view_count': view_count,
                'purchase_count': purchase_count,
                'conversion_rate': conversion_rate,
            })

        # Sort by conversion rate (ascending) and take top limit
        products_with_conversion.sort(key=lambda x: x['conversion_rate'])
        low_conversion = products_with_conversion[:limit]

        low_conversion_data = []
        for item in low_conversion:
            try:
                product = Product.objects.get(id=item['product_id'])
                low_conversion_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'view_count': item['view_count'],
                    'purchase_count': item['purchase_count'],
                    'conversion_rate': round(item['conversion_rate'], 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== HIGH ENGAGEMENT PRODUCTS (high view-to-purchase ratio within period) =====
        # Reuse views and purchases from previous sections
        products_with_engagement = []
        for product_id, view_count in views_by_product.items():
            purchase_count = purchases_by_product.get(product_id, 0)
            if purchase_count > 0:  # Only include products with purchases
                engagement_ratio = (view_count / purchase_count) if purchase_count > 0 else 0
                products_with_engagement.append({
                    'product_id': product_id,
                    'view_count': view_count,
                    'purchase_count': purchase_count,
                    'engagement_ratio': engagement_ratio,
                })

        # Sort by engagement ratio (descending) and take top limit
        products_with_engagement.sort(key=lambda x: x['engagement_ratio'], reverse=True)
        high_engagement = products_with_engagement[:limit]

        high_engagement_data = []
        for item in high_engagement:
            try:
                product = Product.objects.get(id=item['product_id'])
                high_engagement_data.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'view_count': item['view_count'],
                    'purchase_count': item['purchase_count'],
                    'engagement_ratio': round(item['engagement_ratio'], 2),
                })
            except Product.DoesNotExist:
                continue

        # ===== RESPONSE =====
        return Response({
            'period_days': days,
            'low_performing_products': low_performing_data,
            'high_abandonment_products': high_abandonment_data,
            'low_conversion_products': low_conversion_data,
            'high_engagement_products': high_engagement_data,
        })

    @action(detail=False, methods=['get'])
    def customer_lifetime_value(self, request):
        """
        Get top customers by lifetime value with detailed metrics.

        Query params:
        - limit: Number of customers to return (default: 20, max: 100)
        - min_orders: Minimum number of orders to include customer (default: 1)
        - days: Number of days to look back (default: 365 for all-time analysis)

        Returns a dictionary with the following keys:
        - period_days: Number of days included in the analysis
        - customers: List of top customers with metrics (customer_id, customer_name,
                     customer_email, total_revenue, total_orders, average_order_value,
                     first_purchase_date, last_purchase_date, days_since_last_purchase,
                     customer_tier)
        """
        limit = parse_int_param(request.query_params.get('limit'), default=20, max_value=100)
        days = parse_int_param(request.query_params.get('days'), default=365, max_value=3650)
        min_orders = parse_int_param(request.query_params.get('min_orders'), default=1, min_value=1)
        cutoff_date = timezone.now() - timedelta(days=days)

        # Get all completed orders in the period
        completed_orders = Order.objects.filter(
            created_at__gte=cutoff_date,
            status=Order.OrderStatus.COMPLETED
        ).select_related('created_by')

        # Calculate customer metrics
        customer_data = {}
        for order in completed_orders:
            user_id = order.created_by.id
            if user_id not in customer_data:
                customer_data[user_id] = {
                    'user': order.created_by,
                    'total_revenue': Decimal('0.00'),
                    'order_count': 0,
                    'order_dates': []
                }

            # Calculate order revenue
            order_revenue = sum(
                (item.product.price * item.quantity)
                for item in order.items.select_related('product').all()
                if item.product
            )
            customer_data[user_id]['total_revenue'] += order_revenue
            customer_data[user_id]['order_count'] += 1
            customer_data[user_id]['order_dates'].append(order.created_at)

        # Filter by minimum orders and build response
        customers_list = []
        for user_id, data in customer_data.items():
            if data['order_count'] >= min_orders:
                order_dates = sorted(data['order_dates'])
                first_purchase = order_dates[0]
                last_purchase = order_dates[-1]
                days_since_last = (timezone.now() - last_purchase).days
                avg_order_value = data['total_revenue'] / data['order_count']

                # Determine customer tier
                if data['order_count'] >= 11:
                    tier = 'VIP'
                elif data['order_count'] >= 6:
                    tier = 'Loyal'
                elif data['order_count'] >= 2:
                    tier = 'Repeat'
                else:
                    tier = 'New'

                customers_list.append({
                    'customer_id': str(data['user'].id),
                    'customer_name': data['user'].full_name,
                    'customer_email': data['user'].email,
                    'total_revenue': Decimal(data['total_revenue']),
                    'total_orders': data['order_count'],
                    'average_order_value': Decimal(avg_order_value),
                    'first_purchase_date': first_purchase.date().isoformat(),
                    'last_purchase_date': last_purchase.date().isoformat(),
                    'days_since_last_purchase': days_since_last,
                    'customer_tier': tier
                })

        # Sort by total revenue (descending) and limit
        customers_list.sort(key=lambda x: x['total_revenue'], reverse=True)
        top_customers = customers_list[:limit]

        return Response({
            'period_days': days,
            'total_customers': len(customers_list),
            'customers': top_customers
        })

 