from django.test import TestCase
from accounts.factory import UserFactory
from products.factory import ProductBrandFactory, ProductFactory
from checkout.factory import OrderFactory, OrderItemFactory
from accounts.models import User
from django.urls import reverse
from core.tests import BaseAPITestCase
import uuid
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
            role=User.Role.USER
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
        self.assertEqual(response.status_code, 403)
    
