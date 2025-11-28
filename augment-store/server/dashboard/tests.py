from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.factory import ProductFactory
from carts.factory import CartItemFactory
from dashboard.models import ProductStatistics, ProductView


class ProductStatisticsModelTests(BaseAPITestCase):
    """Test ProductStatistics model creation and tracking."""

    def setUp(self):
        super().setUp()
        self.product = ProductFactory()

    def test_product_statistics_created_on_product_creation(self):
        """Test that ProductStatistics is created when a Product is created."""
        # GIVEN a new product is created
        new_product = ProductFactory()

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
        self.product = ProductFactory()
        self.user = UserFactory(
            email="viewer@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_product_view_creation(self):
        """Test that ProductView records are created."""
        # GIVEN a product and user

        # WHEN a ProductView is created
        view = ProductView.objects.create(product=self.product, user=self.user)

        # THEN the view should be recorded
        self.assertTrue(ProductView.objects.filter(product=self.product, user=self.user).exists())
        self.assertEqual(view.product, self.product)
        self.assertEqual(view.user, self.user)


class CartAdditionTrackingTests(BaseAPITestCase):
    """Test cart addition tracking."""

    def setUp(self):
        super().setUp()
        self.product = ProductFactory()
        self.user = UserFactory(
            email="buyer@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_cart_add_count_incremented(self):
        """Test that cart_add_count is incremented when item is added to cart."""
        # GIVEN a product with statistics
        stats = ProductStatistics.objects.get(product=self.product)
        initial_count = stats.cart_add_count

        # WHEN a CartItem is created for this product
        CartItemFactory(product=self.product, created_by=self.user)

        # THEN cart_add_count should be incremented
        stats.refresh_from_db()
        self.assertEqual(stats.cart_add_count, initial_count + 1)


class CartRemovalTrackingTests(BaseAPITestCase):
    """Test cart removal tracking."""

    def setUp(self):
        super().setUp()
        self.product = ProductFactory()
        self.user = UserFactory(
            email="buyer@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )

    def test_cart_remove_count_incremented(self):
        """Test that cart_remove_count is incremented when item is removed from cart."""
        # GIVEN a CartItem for a product
        cart_item = CartItemFactory(product=self.product, created_by=self.user)
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
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products with different statistics
        self.product1 = ProductFactory(name="Product 1")
        self.product2 = ProductFactory(name="Product 2")
        self.product3 = ProductFactory(name="Product 3")

        # Set up statistics for products
        stats1 = ProductStatistics.objects.get(product=self.product1)
        stats1.view_count = 100
        stats1.cart_add_count = 50
        stats1.purchase_count = 30
        stats1.save()

        stats2 = ProductStatistics.objects.get(product=self.product2)
        stats2.view_count = 80
        stats2.cart_add_count = 40
        stats2.purchase_count = 20
        stats2.save()

        stats3 = ProductStatistics.objects.get(product=self.product3)
        stats3.view_count = 60
        stats3.cart_add_count = 30
        stats3.purchase_count = 10
        stats3.save()

    def test_most_viewed_endpoint(self):
        """Test most_viewed endpoint returns products sorted by view count."""
        # GIVEN products with different view counts
        # Create ProductView records to track views
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product1, user=self.member_user)
        ProductView.objects.create(product=self.product2, user=self.member_user)

        # WHEN we call the most_viewed endpoint
        url = reverse("product-statistics-most_viewed")
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND results should be sorted by view count descending
        results = response.data.get('results', [])
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['product_name'], 'Product 1')
        self.assertEqual(results[0]['view_count'], 100)
