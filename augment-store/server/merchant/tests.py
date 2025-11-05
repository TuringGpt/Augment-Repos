from django.test import TestCase
from accounts.factory import UserFactory
from products.factory import ProductBrandFactory
from accounts.models import User
from django.urls import reverse
import uuid
# Create your tests here.
class MerchantBrandListViewTests(TestCase):
    
    def setUp(self):
        super().setUp()
        self.merchant_id = uuid.uuid4()
        self.product_brand = ["Nike", "Adidas", "Puma"]
        self.merchant = UserFactory(
            id=self.merchant_id,
            email="merchant@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MERCHANT
        )

        self.product_brand = ProductBrandFactory(created_by=self.merchant, name="Nike")
        self.product_brand_2 = ProductBrandFactory(created_by=self.merchant name="Adidas")
        self.product_brand_3 = ProductBrandFactory(created_by=self.merchant, name="Puma")
    
    def test_merchant_brand_list_view(self):
        url = reverse(f"v1:merchants:{self.merchant.id}:brands")
        response = self.member_client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)
        values =[response.data[i]["name"] for i in range(len(response.data))]
        self.assertEqual(values, self.product_brand)