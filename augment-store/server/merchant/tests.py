from django.test import TestCase
from accounts.factory import UserFactory
from products.factory import ProductBrandFactory, ProductFactory
from accounts.models import User
from django.urls import reverse
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
