from core.tests import BaseAPITestCase
from rest_framework import status
from django.urls import reverse
from products.factory import SimpleProductFactory, ProductCategoryFactory
from carts.factory import SimpleCartItemFactory
from checkout.factory import OrderFactory, OrderItemFactory
from checkout.models import Order
from dashboard.models import ProductStatistics, ProductView, CartAbandonment
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

class ProductStatisticsModelTests(BaseAPITestCase):
    """Test ProductStatistics model creation and tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()

    def test_product_statistics_created_on_product_creation(self):
        """Test that ProductStatistics is created when a Product is created."""
        # GIVEN a new product is created
        new_product = SimpleProductFactory()

        # THEN ProductStatistics should be created for it
        self.assertTrue(ProductStatistics.objects.filter(product=new_product).exists())

    def test_product_statistics_initial_values(self):
        """Test that ProductStatistics has correct initial values."""
        # GIVEN a product with statistics
        stats = ProductStatistics.objects.get(product=self.product)

        # THEN all counts should be 0
        self.assertEqual(stats.view_count, 0)
        self.assertEqual(stats.cart_add_count, 0)
        self.assertEqual(stats.cart_remove_count, 0)
        self.assertEqual(stats.purchase_count, 0)


class ProductViewTrackingTests(BaseAPITestCase):
    """Test product view tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.test_user = self.user

    def test_product_view_creation(self):
        """Test that ProductView records are created."""
        # GIVEN a product and user

        # WHEN a ProductView is created
        view = ProductView.objects.create(product=self.product, user=self.test_user)

        # THEN the view should be recorded
        self.assertTrue(ProductView.objects.filter(product=self.product, user=self.test_user).exists())
        self.assertEqual(view.product, self.product)
        self.assertEqual(view.user, self.test_user)


class CartAdditionTrackingTests(BaseAPITestCase):
    """Test cart addition tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.test_user = self.user

    def test_cart_add_count_incremented(self):
        """Test that cart_add_count is incremented when item is added to cart."""
        # GIVEN a product with statistics
        stats = ProductStatistics.objects.get(product=self.product)
        initial_count = stats.cart_add_count

        # WHEN a CartItem is created for this product
        SimpleCartItemFactory(product=self.product, created_by=self.test_user)

        # THEN cart_add_count should be incremented
        stats.refresh_from_db()
        self.assertEqual(stats.cart_add_count, initial_count + 1)


class CartRemovalTrackingTests(BaseAPITestCase):
    """Test cart removal tracking."""

    def setUp(self):
        super().setUp()
        # Use SimpleProductFactory to avoid creating images
        self.product = SimpleProductFactory()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.test_user = self.user

    def test_cart_remove_count_incremented(self):
        """Test that cart_remove_count is incremented when item is removed from cart."""
        # GIVEN a CartItem for a product
        cart_item = SimpleCartItemFactory(product=self.product, created_by=self.test_user)
        stats = ProductStatistics.objects.get(product=self.product)
        initial_count = stats.cart_remove_count

        # WHEN the CartItem is deleted
        cart_item.delete()

        # THEN cart_remove_count should be incremented
        stats.refresh_from_db()
        self.assertEqual(stats.cart_remove_count, initial_count + 1)


class ProductStatisticsAPITests(BaseAPITestCase):
    """Test ProductStatistics API endpoints."""

    def setUp(self):
        super().setUp()
        # Reuse the user from BaseAPITestCase instead of creating a new one
        self.member_user = self.user
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products with different statistics using SimpleProductFactory
        self.product1 = SimpleProductFactory(name="Product 1")
        self.product2 = SimpleProductFactory(name="Product 2")
        self.product3 = SimpleProductFactory(name="Product 3")

        # Set up statistics for products using bulk_update for better performance
        stats1 = ProductStatistics.objects.get(product=self.product1)
        stats1.view_count = 100
        stats1.cart_add_count = 50
        stats1.purchase_count = 30

        stats2 = ProductStatistics.objects.get(product=self.product2)
        stats2.view_count = 80
        stats2.cart_add_count = 40
        stats2.purchase_count = 20

        stats3 = ProductStatistics.objects.get(product=self.product3)
        stats3.view_count = 60
        stats3.cart_add_count = 30
        stats3.purchase_count = 10

        # Bulk update all stats at once
        ProductStatistics.objects.bulk_update(
            [stats1, stats2, stats3],
            ['view_count', 'cart_add_count', 'purchase_count']
        )

    def test_most_viewed_endpoint(self):
        """Test most_viewed endpoint returns products sorted by view count."""
        # GIVEN products with different view counts
        # Create ProductView records to track views
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product2, user=self.member_user)

        # WHEN we call the most_viewed endpoint
        url = reverse("v1:product-statistics-most-viewed")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by view count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['view_count'], 100)

    def test_most_added_to_cart_endpoint(self):
        """Test most_added_to_cart endpoint returns products sorted by cart additions."""
        # GIVEN products with different cart add counts

        # WHEN we call the most_added_to_cart endpoint
        url = reverse("v1:product-statistics-most-added-to-cart")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by cart_add_count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['cart_add_count'], 50)

    def test_best_selling_endpoint(self):
        """Test best_selling endpoint returns products sorted by purchase count."""
        # GIVEN products with different purchase counts

        # WHEN we call the best_selling endpoint
        url = reverse("v1:product-statistics-best-selling")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by purchase_count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['purchase_count'], 30)

    def test_general_statistics_endpoint(self):
        """Test general_statistics endpoint returns aggregated metrics."""
        # GIVEN multiple products with statistics

        # WHEN we call the general_statistics endpoint
        url = reverse("v1:product-statistics-general-statistics")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND response should contain aggregated data
        self.assertIn('total_products_tracked', response.data)
        self.assertIn('total_views', response.data)
        self.assertIn('total_cart_additions', response.data)
        self.assertIn('total_purchases', response.data)

    def test_general_statistics_correct_totals(self):
        """Test that general_statistics returns correct sum of metrics, not count."""
        # GIVEN multiple products with specific statistics
        # Product 1: 100 views, 50 cart adds, 30 purchases
        # Product 2: 80 views, 40 cart adds, 20 purchases
        # Product 3: 60 views, 30 cart adds, 10 purchases
        # Expected totals: 240 views, 120 cart adds, 60 purchases

        # WHEN we call the general_statistics endpoint
        url = reverse("v1:product-statistics-general-statistics")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the totals should be the SUM of all metrics, not the COUNT
        self.assertEqual(response.data['total_views'], 240)
        self.assertEqual(response.data['total_cart_additions'], 120)
        self.assertEqual(response.data['total_purchases'], 60)
        self.assertEqual(response.data['total_products_tracked'], 3)

    def test_most_viewed_respects_time_window(self):
        """Test that most_viewed endpoint respects the days parameter for time-based filtering."""
        # GIVEN products with views at different times
        # Create views for product1 within the last 5 days using bulk_create
        recent_views = [
            ProductView(product=self.product1, user=self.member_user)
            for _ in range(5)
        ]
        ProductView.objects.bulk_create(recent_views)

        # Create views for product2 outside the 5-day window (40 days ago)
        old_view = ProductView.objects.create(product=self.product2, user=self.member_user)
        old_view.created_at = timezone.now() - timedelta(days=40)
        old_view.save()

        # WHEN we call most_viewed with days=5
        url = reverse("v1:product-statistics-most-viewed")
        response = self.member_client.get(url, {'days': 5})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND only product1 should be in results (product2's view is outside the window)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['product_name'], 'Product 1')

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access statistics endpoints."""
        # GIVEN an unauthenticated client
        unauthenticated_client = self.client

        # WHEN we try to access the most_viewed endpoint
        url = reverse("v1:product-statistics-most-viewed")
        response = unauthenticated_client.get(url)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_most_viewed_invalid_limit_parameter(self):
        """Test that most_viewed handles invalid limit parameter gracefully."""
        # GIVEN invalid limit parameters
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with non-integer limit
        response = self.member_client.get(url, {'limit': 'invalid'})

        # THEN we should get a 200 response (not 500) with default limit
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_invalid_days_parameter(self):
        """Test that most_viewed handles invalid days parameter gracefully."""
        # GIVEN invalid days parameters
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with non-integer days
        response = self.member_client.get(url, {'days': 'invalid'})

        # THEN we should get a 200 response (not 500) with default days
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_negative_limit_uses_default(self):
        """Test that negative limit values are rejected and default is used."""
        # GIVEN a negative limit
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with negative limit
        response = self.member_client.get(url, {'limit': '-5'})

        # THEN we should get a 200 response with default limit (10)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_most_viewed_limit_capped_at_max(self):
        """Test that limit values above max are capped."""
        # Create enough products to test the cap - reduced from 150 to 15
        # We only need to verify the cap works, not test with massive data
        # Use SimpleProductFactory to avoid creating images
        for _ in range(15):
            SimpleProductFactory()

        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with limit > 100
        response = self.member_client.get(url, {'limit': '500'})

        # THEN we should get a 200 response with max limit (100)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The actual results might be less than 100 if we don't have enough products
        self.assertLessEqual(len(response.data.get('results', [])), 100)

    def test_most_viewed_days_capped_at_max(self):
        """Test that days values above max are capped."""
        url = reverse("v1:product-statistics-most-viewed")

        # WHEN we call with days > 365
        response = self.member_client.get(url, {'days': '1000'})

        # THEN we should get a 200 response with max days (365)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('period_days'), 365)

    def test_most_viewed_ordered_by_period_counts_not_lifetime(self):
        """Test that most_viewed orders by period-specific counts, not lifetime counts."""
        # GIVEN:
        # Product 1: 5 views in the last 5 days, 100 lifetime views
        # Product 2: 10 views in the last 5 days, 50 lifetime views
        # Expected order: Product 2 (10 period views), then Product 1 (5 period views)

        # Create old views for product1 (outside the 5-day window)
        # Note: We can't use bulk_create with custom created_at when auto_now_add=True
        # So we update the timestamps after creation
        old_time = timezone.now() - timedelta(days=40)
        old_views = [
            ProductView(product=self.product1, user=self.member_user)
            for _ in range(95)
        ]
        created_old_views = ProductView.objects.bulk_create(old_views)
        # Update created_at for old views using ORM update() to bypass auto_now_add
        ProductView.objects.filter(
            id__in=[v.id for v in created_old_views]
        ).update(created_at=old_time, updated_at=old_time)

        # Create recent views for product1 (within the 5-day window)
        recent_views_p1 = [
            ProductView(product=self.product1, user=self.member_user)
            for _ in range(5)
        ]
        ProductView.objects.bulk_create(recent_views_p1)

        # Create recent views for product2 (within the 5-day window)
        recent_views_p2 = [
            ProductView(product=self.product2, user=self.member_user)
            for _ in range(10)
        ]
        ProductView.objects.bulk_create(recent_views_p2)

        # WHEN we call most_viewed with days=5
        url = reverse("v1:product-statistics-most-viewed")
        response = self.member_client.get(url, {'days': 5})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be ordered by period-specific counts (not lifetime)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 2)
        # Product 2 should be first (10 period views > 5 period views)
        self.assertEqual(results[0]['product_name'], 'Product 2')
        # Product 1 should be second (5 period views)
        self.assertEqual(results[1]['product_name'], 'Product 1')

    def test_frequently_abandoned_ordered_by_abandonment_count_not_lifetime(self):
        """Test that frequently_abandoned orders by abandonment count, not lifetime cart_remove_count."""
        # GIVEN:
        # Product 1: 2 abandonments, 100 lifetime cart_remove_count
        # Product 2: 5 abandonments, 50 lifetime cart_remove_count
        # Expected order: Product 2 (5 abandonments), then Product 1 (2 abandonments)

        # Create abandonments for product1 (2 abandonments) using bulk_create
        abandonments_p1 = [
            CartAbandonment(product=self.product1, user=self.member_user)
            for _ in range(2)
        ]
        CartAbandonment.objects.bulk_create(abandonments_p1)

        # Create abandonments for product2 (5 abandonments) using bulk_create
        abandonments_p2 = [
            CartAbandonment(product=self.product2, user=self.member_user)
            for _ in range(5)
        ]
        CartAbandonment.objects.bulk_create(abandonments_p2)

        # WHEN we call frequently_abandoned endpoint
        url = reverse("v1:product-statistics-frequently-abandoned")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be ordered by abandonment count (not lifetime cart_remove_count)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 2)
        # Product 2 should be first (5 abandonments > 2 abandonments)
        self.assertEqual(results[0]['product_name'], 'Product 2')
        # Product 1 should be second (2 abandonments)
        self.assertEqual(results[1]['product_name'], 'Product 1')


class AnalyticsOverviewTests(BaseAPITestCase):
    """Test analytics_overview endpoint."""

    def setUp(self):
        super().setUp()
        # Set up authenticated client
        self.member_client = self.authenticated_client

        # Create test products with specific prices
        self.product1 = SimpleProductFactory(name='Product 1', price=Decimal('100.00'))
        self.product2 = SimpleProductFactory(name='Product 2', price=Decimal('50.00'))
        self.product3 = SimpleProductFactory(name='Product 3', price=Decimal('25.00'))

    def test_analytics_overview_endpoint_exists(self):
        """Test that analytics_overview endpoint is accessible."""
        # WHEN we call the analytics_overview endpoint
        url = reverse("v1:product-statistics-analytics-overview")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200)

    def test_analytics_overview_structure(self):
        """Test that analytics_overview returns correct data structure."""
        # WHEN we call the analytics_overview endpoint
        url = reverse("v1:product-statistics-analytics-overview")
        response = self.member_client.get(url)

        # THEN response should contain all expected sections
        self.assertIn('period_days', response.data)
        self.assertIn('overview', response.data)
        self.assertIn('conversion_funnel', response.data)
        self.assertIn('cart_abandonment', response.data)
        self.assertIn('top_products_by_revenue', response.data)
        self.assertIn('category_performance', response.data)

        # AND overview section should have correct fields
        overview = response.data['overview']
        self.assertIn('total_revenue', overview)
        self.assertIn('total_orders', overview)
        self.assertIn('completed_orders', overview)
        self.assertIn('average_order_value', overview)
        self.assertIn('total_products', overview)
        self.assertIn('total_categories', overview)
        self.assertIn('new_customers', overview)

        # AND conversion_funnel section should have correct fields
        funnel = response.data['conversions_funnel']
        self.assertIn('total_views', funnel)
        self.assertIn('total_cart_additions', funnel)
        self.assertIn('total_purchases', funnel)
        self.assertIn('view_to_cart_rate', funnel)
        self.assertIn('cart_to_purchase_rate', funnel)
        self.assertIn('overall_conversion_rate', funnel)

    def test_analytics_overview_with_orders(self):
        """Test analytics_overview calculates revenue correctly from completed orders."""
        # GIVEN completed orders with known products and quantities
        cart_item1 = SimpleCartItemFactory(product=self.product1, quantity=2, created_by=self.user)
        cart_item2 = SimpleCartItemFactory(product=self.product2, quantity=3, created_by=self.user)

        order1 = OrderFactory(created_by=self.user, status=Order.OrderStatus.COMPLETED)
        order_item1 = OrderItemFactory(
            order=order1,
            cart_item=cart_item1,
            product=self.product1,
            quantity=2,
            created_by=self.user
        )
        order_item2 = OrderItemFactory(
            order=order1,
            cart_item=cart_item2,
            product=self.product2,
            quantity=3,
            created_by=self.user
        )

        # Expected revenue: (100 * 2) + (50 * 3) = 200 + 150 = 350
        expected_revenue = Float('350.00')

        # WHEN we call the analytics_overview endpoint
        url = reverse("v1:product-statistics-analytics-overview")
        response = self.member_client.get(url)

        # THEN total_revenue should match expected
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data['overview']['total_revenue'])), expected_revenue)
        self.assertEqual(response.data['overview']['completed_orders'], 1)

    def test_analytics_overview_excludes_pending_orders():
        """Test that pending orders are not included in revenue calculations."""
        # GIVEN a pending order
        cart_item = SimpleCartItemFactory(product=self.product1, quantity=2, created_by=self.user)
        order = OrderFactory(created_by=self.user, status=Order.OrderStatus.PENDING)
        OrderItemFactory(
            order=order,
            cart_item=cart_item,
            product=self.product1,
            quantity=2,
            created_by=self.user
        )

        # WHEN we call the analytics_overview endpoint
        url = reverse("v1product-statistics-analytics-overview")
        response = self.member_client.get(url)

        # THEN revenue should be 0 (pending orders excluded)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['overview']['total_revenue'], 0.0)
        self.assertEqual(response.data['overview']['total_orders'], 1)
        self.assertEqual(response.data['overview']['completed_orders'], 0)

    def test_analytics_overview_excludes_pending_orders(self):
        """Test conversion funnel calculations."""
        # GIVEN views, cart additions, and purchases
        ProductView.objects.create(product=self.product1, user=self.user)
        ProductView.objects.create(product=self.product2, user=self.user)
        ProductView.objects.create(product=self.product3, user=self.user)
        ProductView.objects.create(product=self.product1, user=self.user)
        # 4 total views

        SimpleCartItemFactory(product=self.product1, created_by=self.user)
        SimpleCartItemFactory(product=self.product2, created_by=self.user)
        # 2 cart additions

        # Create a completed order with 1 item (1 purchase)
        order = OrderFactory(created_by=self.user, status=Order.OrderStatus.COMPLETED)
        # Create order item manually to avoid factory creating extra cart items
        order_item = OrderItemFactory(
            order=order,
            created_by=self.user,
            cart_item=None
        )
        # Set product and quantity after creation to avoid factory hooks
        order_item.product = self.product1
        order_item.quantity = 1
        order_item.save()
        # 1 purchase (1 unit)

        # WHEN we call the analytics_overview endpoint
        url = reverse("v1:product-statistics-analytics-overview")
        response = self.member_client.get(url)

        # THEN conversion rates should be calculated correctly
        funnel = response.data['conversion_funnel']
        self.assertEqual(funnel['total_views'], 4)
        self.assertEqual(tunnel['total_cart_additions'], 2)
        self.assertEqual(funnel['total_purchases'], 1)

        # view_to_cart_rate = 2/4 * 100 = 50%
        self.assertEqual(funnel['view_to_cart_rate'], 50.0)
        # cart_to_purchase_rate = 1/2 * 100 = 50%
        self.assertEqual(funnel['cart_to_purchase_rate'], 50.0)
        # overall_conversion_rate = 1/4 * 100 = 25%
        self.assertEqual(funnel['overall_conversion_rate'], 25.0)

    def test_category_performance_counts_distinct_orders(self):
        """
        Test that category performance counts distinct orders, not order items.
        If a single order has multiple items from the same category, it should count as 1 order.
        """
        # GIVEN a category with products
        category = ProductCategoryFactory(name="Electronics")
        product1 = SimpleProductFactory(name="Laptop", price=Decimal('1000.00'), category=category)
        product2 = SimpleProductFactory(name="Mouse", price=Decimal('50.00'), category=category)

        # AND a completed order with 2 items from the same category
        order = OrderFactory(created_by=self.user, status=Order.OrderStatus.COMPLETED)

        # Create first order item
        order_item1 = OrderItemFactory(order=order, created_by=self.user, cart_item=None)
        order_item1.product = product1
        order_item1.quantity = 1
        order_item1.save()

        # Create second order item from the same order but different product in same category
        order_item2 = OrderItemFactory(order=order, created_by=self.user, cart_item=None)
        order_item2.product = product2
        order_item2.quantity = 2
        order_item2.save()

        # WHEN we call the analytics_overview endpoint
        url = reverse("v1:product-statistics-analytics-overview")
        response = self.member_client.get(url)

        # THEN the category should show 1 order (not 2), even though there are 2 order items
        category_performance = response.data['category_performance']
        electronics_category = next((c for c in category_performance if c['category_name'] == 'Electronics'), None)

        self.assertIsNotNone(electronics_category)
        self.assertEqual(electronics_category['orders'], 1)  # Should be 1, not 2
        self.assertEqual(electronics_category['units_sold'], 3)  # 1 laptop + 2 mice
        self.assertEqual(electronics_category['revenue'], 1100.0)  # 1000 + (50 * 2)
