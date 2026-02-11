from django.test import TestCase
from accounts.factory import UserFactory
from products.factory import ProductBrandFactory, ProductFactory
from checkout.factory import OrderFactory, OrderItemFactory
from accounts.models import User
from django.urls import reverse
from core.tests import BaseAPITestCase
import uuid
from products.services import ProductBrandCacheService, ProductCacheService, ProductSearchCacheService
from django.core.cache import cache
from django.test.utils import CaptureQueriesContext
from django.db import connection
# Create your tests here.
class MerchantBrandListViewTests(TestCase):
    
    def setUp(self):
        super().setUp()
        self.merchant_id = uuid.uuid4()
        self.product_brand_names = ["Nike", "Adidas", "Puma"]
        self.merchant = UserFactory(
            id=self.merchant_id,
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )

        self.product_brand = ProductBrandFactory(created_by=self.merchant, name="Nike")
        self.product_brand_2 = ProductBrandFactory(created_by=self.merchant, name="Adidas")
        self.product_brand_3 = ProductBrandFactory(created_by=self.merchant, name="Puma")
    
    def test_merchant_brand_list_view(self):
        url = reverse(f"v1:merchant:merchant_brand_list", kwargs={"pk": str(self.merchant_id)})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 3)
        values =[response.data['results'][i]["name"] for i in range(len(response.data['results']))]
        self.assertEqual(set(values), set(self.product_brand_names))


class MerchantProductListViewTests(TestCase):

    def setUp(self):
        super().setUp()
        self.merchant_id = uuid.uuid4()
        self.merchant_id_no_products = uuid.uuid4()
        self.product_names = ["Nike Shoe", "Adidas Shoe", "Puma Shoe"]
        self.merchant = UserFactory(
            id=self.merchant_id,
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.merchant_no_products = UserFactory(
            id=self.merchant_id_no_products,
            email="merchant_no_products@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.brand = ProductBrandFactory(created_by=self.merchant, name="Nike")
        self.product_1 = ProductFactory(created_by=self.merchant, name="Nike Shoe", brand=self.brand)
        self.product_2 = ProductFactory(created_by=self.merchant, name="Adidas Shoe", brand=self.brand)
        self.product_3 = ProductFactory(created_by=self.merchant, name="Puma Shoe", brand=self.brand)

    def test_merchant_product_list_view(self):
        url = reverse("v1:merchant:merchant_product_list", kwargs={"pk": str(self.merchant_id)})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 3)
        values =[response.data['results'][i]["name"] for i in range(len(response.data['results']))]
        self.assertEqual(set(values), set(self.product_names))

    def test_merchant_no_products(self):
        url = reverse("v1:merchant:merchant_product_list", kwargs={"pk": str(self.merchant_id_no_products)})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 0)


class MerchantOrdersListViewTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.merchant_id = uuid.uuid4()
        self.user_id = uuid.uuid4()
        self.merchant = UserFactory(
            id=self.merchant_id,
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )
        self.user = UserFactory(
            id=self.user_id,
            email="normal_user@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.brand = ProductBrandFactory(created_by=self.merchant, name="Nike")
        self.product = ProductFactory(created_by=self.merchant, name="Nike Shoe", brand=self.brand)
        self.order = OrderFactory(created_by=self.merchant)
        self.order_item = OrderItemFactory(order=self.order, cart_item__product=self.product, created_by=self.merchant)
        self.order_item_2 = OrderItemFactory(order=self.order, cart_item__product=self.product, created_by=self.merchant)
        self.order_item_3 = OrderItemFactory(order=self.order, cart_item__product=self.product, created_by=self.merchant)
        self.order_2 = OrderFactory(created_by=self.merchant)
        self.order_item_4 = OrderItemFactory(order=self.order_2, cart_item__product=self.product, created_by=self.merchant)

    def test_merchant_order_list_view(self):
        merchant_client = self.authenticated_client
        merchant_client.force_authenticate(user=self.merchant)
        url = reverse("v1:merchant:merchant_order_list")
        response = merchant_client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 2)

    def test_merchant_authorization(self):
        merchant_client = self.authenticated_client
        merchant_client.force_authenticate(user=self.merchant)
        url = reverse("v1:merchant:merchant_order_list")
        response = merchant_client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_user_authorization(self):
        member_client = self.authenticated_client
        member_client.force_authenticate(user=self.user)
        url = reverse("v1:merchant:merchant_order_list")
        response = member_client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_merchant_order_unauthenticated(self):
        url = reverse("v1:merchant:merchant_order_list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)


class MerchantCachingTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        # Only clear relevant namespaces to prevent flakiness in parallel tests
        ProductBrandCacheService().clear_namespace()
        ProductCacheService().clear_namespace()
        from products.views import FeaturedProductCacheService
        FeaturedProductCacheService().clear_namespace()
        ProductSearchCacheService().clear_namespace()
        self.merchant_1 = UserFactory(role=User.Role.MERCHANT)
        self.merchant_2 = UserFactory(role=User.Role.MERCHANT)
        
        # Check if caching backend supports the clear_namespace operation
        from django.core.cache import cache
        self.caching_enabled = (
            (hasattr(cache, 'client') and hasattr(cache.client, 'get_client')) or 
            hasattr(cache, '_cache')
        )

    def test_merchant_brand_list_cache_isolation(self):
        # GIVEN two merchants with different brands
        ProductBrandFactory(created_by=self.merchant_1, name="Merchant 1 Brand")
        ProductBrandFactory(created_by=self.merchant_2, name="Merchant 2 Brand")

        url_1 = reverse("v1:merchant:merchant_brand_list", kwargs={"pk": str(self.merchant_1.id)})
        url_2 = reverse("v1:merchant:merchant_brand_list", kwargs={"pk": str(self.merchant_2.id)})

        # WHEN we fetch merchant 1's brands
        # SHOULD hit DB
        with CaptureQueriesContext(connection) as queries:
             response1 = self.client.get(url_1)
             self.assertEqual(response1.status_code, 200)
             self.assertGreater(len(queries), 0)
             self.assertEqual(len(response1.data["results"]), 1)
             self.assertEqual(response1.data["results"][0]["name"], "Merchant 1 Brand")

        # AND fetch again (cached if enabled)
        if self.caching_enabled:
            with self.assertNumQueries(0):
                 response = self.client.get(url_1)
                 self.assertEqual(response.status_code, 200)

        # WHEN we fetch merchant 2's brands
        # SHOULD NOT hit merchant 1's cache (isolation test)
        with CaptureQueriesContext(connection) as queries:
             response2 = self.client.get(url_2)
             self.assertEqual(response2.status_code, 200)
             self.assertGreater(len(queries), 0)
             self.assertEqual(len(response2.data["results"]), 1)
             self.assertEqual(response2.data["results"][0]["name"], "Merchant 2 Brand")
             self.assertNotEqual(response1.data, response2.data)

    def test_merchant_brand_list_invalidation(self):
        # GIVEN a merchant has some brands cached
        self.authenticated_client.force_authenticate(user=self.merchant_1)
        url = reverse("v1:merchant:merchant_brand_list", kwargs={"pk": str(self.merchant_1.id)})
        
        ProductBrandFactory(created_by=self.merchant_1, name="Existing")
        
        # Initial fetch to populate cache (using authenticated client)
        self.authenticated_client.get(url)

        # AND fetch again (verify it's cached)
        if self.caching_enabled:
            with self.assertNumQueries(0):
                response = self.authenticated_client.get(url)
                self.assertEqual(response.status_code, 200)

        # WHEN a new brand is created
        create_url = reverse("v1:create_product_brand")
        self.authenticated_client.post(create_url, {"name": "Newly Created", "description": "Desc"})

        # THEN the next fetch SHOULD hit the database (cache invalidated)
        with CaptureQueriesContext(connection) as queries:
            response = self.authenticated_client.get(url)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.data["results"]), 2)
            self.assertGreater(len(queries), 0)

    def test_merchant_vs_public_brand_list_isolation(self):
        # GIVEN a merchant brand
        ProductBrandFactory(created_by=self.merchant_1, name="Shared Service Brand")

        merchant_url = reverse("v1:merchant:merchant_brand_list", kwargs={"pk": str(self.merchant_1.id)})
        public_url = reverse("v1:product_brand_list")

        # WHEN we fetch the merchant brand list
        # SHOULD hit DB
        with CaptureQueriesContext(connection) as queries:
             response = self.client.get(merchant_url)
             self.assertEqual(response.status_code, 200)
             self.assertGreater(len(queries), 0)

        # WHEN we fetch the public brand list
        # SHOULD hit DB again (isolation test - different views/keys)
        with CaptureQueriesContext(connection) as queries:
             response = self.client.get(public_url)
             self.assertEqual(response.status_code, 200)
             self.assertGreater(len(queries), 0)

    def test_merchant_product_list_cache_isolation(self):
        # GIVEN two merchants with different products
        brand1 = ProductBrandFactory(created_by=self.merchant_1)
        brand2 = ProductBrandFactory(created_by=self.merchant_2)
        ProductFactory(created_by=self.merchant_1, name="P1", brand=brand1)
        ProductFactory(created_by=self.merchant_2, name="P2", brand=brand2)

        url_1 = reverse("v1:merchant:merchant_product_list", kwargs={"pk": str(self.merchant_1.id)})
        url_2 = reverse("v1:merchant:merchant_product_list", kwargs={"pk": str(self.merchant_2.id)})

        # WHEN we fetch merchant 1's products
        with CaptureQueriesContext(connection) as queries:
             response1 = self.client.get(url_1)
             self.assertEqual(response1.status_code, 200)
             self.assertGreater(len(queries), 0)
             self.assertEqual(len(response1.data["results"]), 1)
             self.assertEqual(response1.data["results"][0]["name"], "P1")

        # AND fetch again (cached if enabled)
        if self.caching_enabled:
            with self.assertNumQueries(0):
                 response = self.client.get(url_1)
                 self.assertEqual(response.status_code, 200)
                 self.assertEqual(len(response.data["results"]), 1)
                 self.assertEqual(response.data["results"][0]["name"], "P1")

        # WHEN we fetch merchant 2's products
        # SHOULD NOT hit merchant 1's cache
        with CaptureQueriesContext(connection) as queries:
             response2 = self.client.get(url_2)
             self.assertEqual(response2.status_code, 200)
             self.assertGreater(len(queries), 0)
             self.assertEqual(len(response2.data["results"]), 1)
             self.assertEqual(response2.data["results"][0]["name"], "P2")

    def test_merchant_product_list_invalidation(self):
         # GIVEN a merchant has products cached
         self.authenticated_client.force_authenticate(user=self.merchant_1)
         url = reverse("v1:merchant:merchant_product_list", kwargs={"pk": str(self.merchant_1.id)})
         brand = ProductBrandFactory(created_by=self.merchant_1)
         product = ProductFactory(created_by=self.merchant_1, brand=brand, name="Old Name")

         # Initial fetch to populate cache (authenticated)
         self.authenticated_client.get(url)
         # AND fetch again (verify it's cached)
         if self.caching_enabled:
             with self.assertNumQueries(0):
                 response = self.authenticated_client.get(url)
                 self.assertEqual(response.status_code, 200)

         # WHEN a product is updated
         update_url = reverse("v1:product_update_delete", kwargs={"pk": str(product.id)})
         self.authenticated_client.patch(update_url, {"name": "Updated Name"})

         # THEN the merchant list cache SHOULD be invalidated
         with CaptureQueriesContext(connection) as queries:
            response = self.authenticated_client.get(url)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["results"][0]["name"], "Updated Name")
            self.assertGreater(len(queries), 0)
    
