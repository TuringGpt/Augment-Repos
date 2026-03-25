import unittest
from unittest.mock import  patch
from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from django.urls import reverse
from products.factory import ProductFactory
from carts.factory import CartItemFactory
from checkout.models import Order
from checkout.factory import OrderFactory, OrderItemFactory, PaymentFactory, ShippingAddressFactory, BillingAddressFactory, ContactInformationFactory
from decimal import Decimal
from checkout.services import StripeService

class CreateOrderViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a member user for authenticated tests
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products with specific prices for calculation testing
        self.product1 = ProductFactory(quantity=100, price=Decimal("25.00"))
        self.product2 = ProductFactory(quantity=50, price=Decimal("15.00"))
        self.product3 = ProductFactory(quantity=30, price=Decimal("10.00"))

    def test_create_order_success(self):
        # GIVEN an authenticated user exists
        # AND the user has cart items
        cart_item1 = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=self.member_user
        )
        cart_item2 = CartItemFactory(
            product=self.product2,
            quantity=1,
            created_by=self.member_user
        )

        # WHEN we make a POST request to create an order
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item1.id), str(cart_item2.id)]
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created
        self.assertEqual(Order.objects.count(), 1)
        order = Order.objects.first()
        self.assertEqual(order.created_by, self.member_user)
        self.assertEqual(order.status, Order.OrderStatus.PENDING)

        # AND the order should have the correct items
        self.assertEqual(order.items.count(), 2)
        order_item_cart_ids = [item.cart_item.id for item in order.items.all()]
        self.assertIn(cart_item1.id, order_item_cart_ids)
        self.assertIn(cart_item2.id, order_item_cart_ids)

    def test_create_order_with_single_item(self):
        # GIVEN an authenticated user exists
        # AND the user has one cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )

        # WHEN we make a POST request to create an order
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)]
        }
        response = self.member_client.post(url, payload, format='json')
        
        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created with one item
        order = Order.objects.first()
        self.assertEqual(order.items.count(), 1)

    def test_create_order_with_empty_cart_items(self):
        # GIVEN an authenticated user exists

        # WHEN we make a POST request with empty cart_items
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": []
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 201 response (order created but empty)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created with no items
        order = Order.objects.first()
        self.assertEqual(order.items.count(), 0)

    def test_create_order_with_invalid_cart_item_id(self):
        # GIVEN an authenticated user exists

        # WHEN we make a POST request with an invalid cart item ID
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": ["00000000-0000-0000-0000-000000000000"]
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND no order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_unauthenticated(self):
        # GIVEN a user is not authenticated
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )

        # WHEN we make a POST request to create an order
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)]
        }
        response = self.client.post(url, payload, format='json')

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # AND no order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_with_missing_cart_items_field(self):
        # GIVEN an authenticated user exists

        # WHEN we make a POST request without cart_items field
        url = reverse("v1:checkout:create_order")
        payload = {}
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND no order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_with_both_shipping_address_and_id(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        # AND the user has an existing shipping address
        shipping_address = ShippingAddressFactory(user=self.member_user)

        # WHEN we make a POST request with both shipping_address and shipping_address_id
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "shipping_address": {
                "first_name": "John",
                "last_name": "Doe",
                "address_line_1": "123 Main St",
                "address_line_2": "",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "USA"
            },
            "shipping_address_id": str(shipping_address.id)
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND the error message should indicate the conflict
        self.assertIn("Cannot provide both shipping_address and shipping_address_id", str(response.data))

        # AND no order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_with_both_billing_address_and_id(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        # AND the user has an existing billing address
        billing_address = BillingAddressFactory(user=self.member_user)

        # WHEN we make a POST request with both billing_address and billing_address_id
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "billing_address": {
                "first_name": "Jane",
                "last_name": "Smith",
                "address_line_1": "456 Oak Ave",
                "address_line_2": "Apt 2B",
                "city": "Los Angeles",
                "state": "CA",
                "postal_code": "90001",
                "country": "USA"
            },
            "billing_address_id": str(billing_address.id)
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND the error message should indicate the conflict
        self.assertIn("Cannot provide both billing_address and billing_address_id", str(response.data))

        # AND no order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_with_both_contact_information_and_id(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        # AND the user has existing contact information
        contact_info = ContactInformationFactory(user=self.member_user)

        # WHEN we make a POST request with both contact_information and contact_information_id
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "contact_information": {
                "first_name": "Bob",
                "last_name": "Johnson",
                "email": "bob@example.com",
                "phone": "+1234567890"
            },
            "contact_information_id": str(contact_info.id)
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # AND the error message should indicate the conflict
        self.assertIn("Cannot provide both contact_information and contact_information_id", str(response.data))

        # AND no order should be created
        self.assertEqual(Order.objects.count(), 0)

    def test_create_order_with_shipping_address_only(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )

        # WHEN we make a POST request with only shipping_address (no ID)
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "shipping_address": {
                "first_name": "John",
                "last_name": "Doe",
                "address_line_1": "123 Main St",
                "address_line_2": "",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "USA"
            }
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created with the shipping address
        order = Order.objects.first()
        self.assertIsNotNone(order.shipping_address)
        self.assertEqual(order.shipping_address.first_name, "John")
        self.assertEqual(order.shipping_address.last_name, "Doe")

    def test_create_order_with_shipping_address_id_only(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        # AND the user has an existing shipping address
        shipping_address = ShippingAddressFactory(user=self.member_user)

        # WHEN we make a POST request with only shipping_address_id (no nested object)
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "shipping_address_id": str(shipping_address.id)
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created with the existing shipping address
        order = Order.objects.first()
        self.assertEqual(order.shipping_address.id, shipping_address.id)

    def test_create_order_with_billing_address_id_only(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        # AND the user has an existing billing address
        billing_address = BillingAddressFactory(user=self.member_user)

        # WHEN we make a POST request with only billing_address_id
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "billing_address_id": str(billing_address.id)
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created with the existing billing address
        order = Order.objects.first()
        self.assertEqual(order.billing_address.id, billing_address.id)

    def test_create_order_with_contact_information_id_only(self):
        # GIVEN an authenticated user exists
        # AND the user has a cart item
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user
        )
        # AND the user has existing contact information
        contact_info = ContactInformationFactory(user=self.member_user)

        # WHEN we make a POST request with only contact_information_id
        url = reverse("v1:checkout:create_order")
        payload = {
            "cart_items": [str(cart_item.id)],
            "contact_information_id": str(contact_info.id)
        }
        response = self.member_client.post(url, payload, format='json')

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # AND an order should be created with the existing contact information
        order = Order.objects.first()
        self.assertEqual(order.contact_information.id, contact_info.id)


class OrderListViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create two member users for testing
        self.member_user1 = UserFactory(
            email="member1@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_user2 = UserFactory(
            email="member2@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client1 = self.authenticated_client
        self.member_client1.force_authenticate(user=self.member_user1)

        # Create test products
        self.product1 = ProductFactory(quantity=100, price=Decimal("25.00"))
        self.product2 = ProductFactory(quantity=50, price=Decimal("15.00"))

    def test_list_orders_authenticated(self):
        # GIVEN an authenticated user exists
        # AND the user has created orders
        cart_item1 = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=self.member_user1
        )
        cart_item2 = CartItemFactory(
            product=self.product2,
            quantity=1,
            created_by=self.member_user1
        )

        order1 = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order1, cart_item=cart_item1, created_by=self.member_user1)
        OrderItemFactory(order=order1, cart_item=cart_item2, created_by=self.member_user1)

        order2 = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order2, cart_item=cart_item1, created_by=self.member_user1)

        # WHEN we make a GET request to list orders
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the user's orders
        self.assertEqual(len(response.data["results"]), 2)

        # AND the orders should be ordered by created_at descending (newest first)
        self.assertEqual(str(response.data["results"][0]["id"]), str(order2.id))
        self.assertEqual(str(response.data["results"][1]["id"]), str(order1.id))

    def test_list_orders_with_nested_data(self):
        # GIVEN an authenticated user exists
        # AND the user has an order with items
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=self.member_user1
        )

        order = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user1)

        # WHEN we make a GET request to list orders
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain nested order items
        order_data = response.data["results"][0]
        self.assertIn("items", order_data)
        self.assertEqual(len(order_data["items"]), 1)

        # AND the order items should contain cart item data
        order_item = order_data["items"][0]
        self.assertIn("cart_item", order_item)
        self.assertIn("product", order_item)

        # AND the response should contain calculated fields
        self.assertIn("subtotal", order_data)
        self.assertIn("tax", order_data)
        self.assertIn("shipping", order_data)
        self.assertIn("total", order_data)

    def test_list_orders_only_shows_user_orders(self):
        # GIVEN two users exist with their own orders
        cart_item1 = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user1
        )
        cart_item2 = CartItemFactory(
            product=self.product2,
            quantity=1,
            created_by=self.member_user2
        )

        order1 = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order1, cart_item=cart_item1, created_by=self.member_user1)

        order2 = OrderFactory(created_by=self.member_user2)
        OrderItemFactory(order=order2, cart_item=cart_item2, created_by=self.member_user2)

        # WHEN user1 makes a GET request to list orders
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should only contain user1's orders
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(str(response.data["results"][0]["id"]), str(order1.id))

    def test_list_orders_empty(self):
        # GIVEN an authenticated user exists
        # AND the user has no orders

        # WHEN we make a GET request to list orders
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain an empty list
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_orders_unauthenticated(self):
        # GIVEN a user is not authenticated

        # WHEN we make a GET request to list orders
        url = reverse("v1:checkout:order_list")
        response = self.client.get(url)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_orders_filter_by_status(self):
        # GIVEN an authenticated user has orders with different statuses
        order_pending = OrderFactory(
            created_by=self.member_user1,
            status=Order.OrderStatus.PENDING
        )
        order_completed = OrderFactory(
            created_by=self.member_user1,
            status=Order.OrderStatus.COMPLETED
        )

        # WHEN we filter by status=pending
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url, {"status": "pending"})

        # THEN we should get only the pending order
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], str(order_pending.id))

    def test_list_orders_filter_by_status_no_match(self):
        # GIVEN an authenticated user has a pending order
        OrderFactory(
            created_by=self.member_user1,
            status=Order.OrderStatus.PENDING
        )

        # WHEN we filter by status=cancelled
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url, {"status": "cancelled"})

        # THEN we should get an empty list
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_orders_filter_by_status_invalid(self):
        # GIVEN an authenticated user exists
        # WHEN we filter by an invalid status value
        url = reverse("v1:checkout:order_list")
        response = self.member_client1.get(url, {"status": "shipped"})

        # THEN we should get a 400 response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)


class RetrieveOrderViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create two member users for testing access control
        self.member_user1 = UserFactory(
            email="member1@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_user2 = UserFactory(
            email="member2@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client1 = self.authenticated_client
        self.member_client1.force_authenticate(user=self.member_user1)

        # Create test products
        self.product1 = ProductFactory(quantity=100, price=Decimal("25.00"))
        self.product2 = ProductFactory(quantity=50, price=Decimal("15.00"))

    def test_retrieve_order_success(self):
        # GIVEN an authenticated user exists
        # AND the user has created an order with items
        cart_item1 = CartItemFactory(
            product=self.product1,
            quantity=2,
            created_by=self.member_user1
        )
        cart_item2 = CartItemFactory(
            product=self.product2,
            quantity=1,
            created_by=self.member_user1
        )

        order = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order, cart_item=cart_item1, created_by=self.member_user1)
        OrderItemFactory(order=order, cart_item=cart_item2, created_by=self.member_user1)

        # WHEN we make a GET request to retrieve the order
        url = reverse("v1:checkout:retrieve_order", kwargs={"pk": str(order.id)})
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the order details
        self.assertEqual(str(response.data["id"]), str(order.id))
        self.assertEqual(response.data["status"], order.status)
        self.assertEqual(len(response.data["items"]), 2)

        # AND the order items should be included with product details
        order_items = response.data["items"]
        item = order_items[0]
        self.assertIn("cart_item", item)
        self.assertIn("product", item)

    def test_retrieve_order_with_payment_status(self):
        # GIVEN an authenticated user exists
        # AND the user has created an order
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user1
        )

        order = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user1)

        # WHEN we make a GET request to retrieve the order
        url = reverse("v1:checkout:retrieve_order", kwargs={"pk": str(order.id)})
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain payment status
        self.assertIn("payment_status", response.data)
        self.assertEqual(response.data["payment_status"], "pending")

    def test_retrieve_order_not_found(self):
        # GIVEN an authenticated user exists
        # AND no order exists with the given ID
        non_existent_order_id = "00000000-0000-0000-0000-000000000000"

        # WHEN we make a GET request to retrieve the non-existent order
        url = reverse("v1:checkout:retrieve_order", kwargs={"pk": non_existent_order_id})
        response = self.member_client1.get(url)

        # THEN we should get a 404 response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_order_access_control(self):
        # GIVEN two users exist with their own orders
        cart_item1 = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user1
        )
        cart_item2 = CartItemFactory(
            product=self.product2,
            quantity=1,
            created_by=self.member_user2
        )

        order1 = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order1, cart_item=cart_item1, created_by=self.member_user1)

        order2 = OrderFactory(created_by=self.member_user2)
        OrderItemFactory(order=order2, cart_item=cart_item2, created_by=self.member_user2)

        # WHEN user1 tries to access user2's order
        url = reverse("v1:checkout:retrieve_order", kwargs={"pk": str(order2.id)})
        response = self.member_client1.get(url)

        # THEN we should get a 404 response (not found for this user)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_order_unauthenticated(self):
        # GIVEN a user is not authenticated
        # AND an order exists
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=1,
            created_by=self.member_user1
        )
        order = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user1)

        # WHEN we make a GET request to retrieve the order
        url = reverse("v1:checkout:retrieve_order", kwargs={"pk": str(order.id)})
        response = self.client.get(url)

        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_order_response_structure(self):
        # GIVEN an authenticated user exists
        # AND the user has created an order
        cart_item = CartItemFactory(
            product=self.product1,
            quantity=3,
            created_by=self.member_user1
        )

        order = OrderFactory(created_by=self.member_user1)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user1)

        # WHEN we make a GET request to retrieve the order
        url = reverse("v1:checkout:retrieve_order", kwargs={"pk": str(order.id)})
        response = self.member_client1.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain all expected fields
        expected_fields = ["id", "status", "items", "subtotal", "tax", "shipping", "total", "created_at", "updated_at", "payment_status"]
        for field in expected_fields:
            self.assertIn(field, response.data)

        # AND the order items should be properly nested
        self.assertEqual(len(response.data["items"]), 1)
        order_item = response.data["items"][0]
        self.assertIn("id", order_item)
        self.assertIn("cart_item", order_item)
        self.assertIn("created_at", order_item)

class OrderPaymentTest(BaseAPITestCase):
    
    def setUp(self):
        super().setUp()

    # mock the create_payment_session method
    @patch("checkout.services.StripeService.create_payment_session")
    def test_payment_order(self, mock_create_payment_session):

          # Mock the Stripe session object returned by the service
        mock_create_payment_session.return_value = type(
            "MockSession",
            (object,),
            {"id": "sess_test_123", "client_secret": "mocked_client_secret"}
        )()

        # GIVEN I have an order
        order = OrderFactory(created_by=self.user)
        cart_item = CartItemFactory(quantity=1)
        OrderItemFactory(order=order, cart_item=cart_item)

        # WHEN I make a payment for the order
        url = reverse("v1:checkout_payments:payment_order")

        payload = {
            "order": str(order.id),
            "payment_method": "stripe",
        }
        response = self.authenticated_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)



class StripeServiceTests(BaseAPITestCase):

    # skip this test for now only run it locally, remove the skip decorator to run it locally
    @unittest.skip("Skipping StripeServiceTests for now. Uncomment to run it locally.")
    @patch("stripe.checkout.Session.create")
    def test_create_payment_session(self, mock_create_session):

        mock_create_session.return_value = {
            "client_secret": "mocked_client_secret",
        }

        # GIVEN I have payment and order
        order = OrderFactory()
        cart_item = CartItemFactory(quantity=1)
        OrderItemFactory(order=order, cart_item=cart_item)
        payment = PaymentFactory(order=order)

        # WHEN we create a payment session
        stripe_service = StripeService()
        session = stripe_service.create_payment_session(payment)

        # THEN we should get a session object
        self.assertIsNotNone(session)
        self.assertIn("client_secret", session)


class CheckoutPaymentConfirmationViewTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Create a member user for testing
        self.member_user = UserFactory(
            email="member@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.MEMBER
        )
        self.member_client = self.authenticated_client
        self.member_client.force_authenticate(user=self.member_user)

        # Create test products
        self.product = ProductFactory(quantity=100, price=Decimal("25.00"))

    def test_payment_confirmation_page_renders_successfully(self):
        # GIVEN an order exists with a payment
        cart_item = CartItemFactory(
            product=self.product,
            quantity=1,
            created_by=self.member_user
        )
        order = OrderFactory(created_by=self.member_user)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user)
        payment = PaymentFactory(order=order, created_by=self.member_user)

        # WHEN we make a GET request to the payment confirmation page
        url = reverse("v1:checkout:order_confirmation", kwargs={"pk": str(order.id)})
        response = self.client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should be HTML content
        self.assertIn("text/html", response["Content-Type"])

        # AND the page should contain confirmation text
        self.assertContains(response, "Order Confirmed")
        self.assertContains(response, "Thank you for your purchase")

    def test_payment_confirmation_page_contains_return_url(self):
        # GIVEN an order exists with a payment
        cart_item = CartItemFactory(
            product=self.product,
            quantity=1,
            created_by=self.member_user
        )
        order = OrderFactory(created_by=self.member_user)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user)
        payment = PaymentFactory(order=order, created_by=self.member_user)

        # WHEN we make a GET request to the payment confirmation page
        url = reverse("v1:checkout:order_confirmation", kwargs={"pk": str(order.id)})
        response = self.client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the page should contain the return URL button
        self.assertContains(response, "Return to Homepage")

    def test_payment_confirmation_page_accessible_without_authentication(self):
        # GIVEN an order exists with a payment
        cart_item = CartItemFactory(
            product=self.product,
            quantity=1,
            created_by=self.member_user
        )
        order = OrderFactory(created_by=self.member_user)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user)
        payment = PaymentFactory(order=order, created_by=self.member_user)

        # WHEN an unauthenticated user makes a GET request to the payment confirmation page
        url = reverse("v1:checkout:order_confirmation", kwargs={"pk": str(order.id)})
        response = self.client.get(url)

        # THEN we should get a 200 response (no authentication required)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the page should render successfully
        self.assertContains(response, "Order Confirmed")

    def test_payment_confirmation_page_with_invalid_order_id(self):
        # GIVEN no order exists with the given ID
        non_existent_order_id = "00000000-0000-0000-0000-000000000000"

        # WHEN we make a GET request to the payment confirmation page with invalid ID
        url = reverse("v1:checkout:order_confirmation", kwargs={"pk": non_existent_order_id})
        response = self.client.get(url)

        # THEN we should still get a 200 response (template view doesn't validate order existence)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the page should render the confirmation template
        self.assertContains(response, "Order Confirmed")

    def test_payment_confirmation_page_template_structure(self):
        # GIVEN an order exists with a payment
        cart_item = CartItemFactory(
            product=self.product,
            quantity=1,
            created_by=self.member_user
        )
        order = OrderFactory(created_by=self.member_user)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user)
        payment = PaymentFactory(order=order, created_by=self.member_user)

        # WHEN we make a GET request to the payment confirmation page
        url = reverse("v1:checkout:order_confirmation", kwargs={"pk": str(order.id)})
        response = self.client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the page should contain expected HTML elements
        self.assertContains(response, "<!DOCTYPE html>")
        self.assertContains(response, "<title>Order Confirmed - Augment Store</title>")
        self.assertContains(response, "success-icon")
        self.assertContains(response, "<button")

    def test_payment_confirmation_page_authenticated_user(self):
        # GIVEN an authenticated user exists
        # AND the user has an order with a payment
        cart_item = CartItemFactory(
            product=self.product,
            quantity=1,
            created_by=self.member_user
        )
        order = OrderFactory(created_by=self.member_user)
        OrderItemFactory(order=order, cart_item=cart_item, created_by=self.member_user)
        payment = PaymentFactory(order=order, created_by=self.member_user)

        # WHEN the authenticated user makes a GET request to the payment confirmation page
        url = reverse("v1:checkout:order_confirmation", kwargs={"pk": str(order.id)})
        response = self.member_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the page should render successfully
        self.assertContains(response, "Order Confirmed")
        self.assertContains(response, "Thank you for your purchase")


class AdminOrderTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.admin_user = UserFactory(
            email="admin_orders@example.com",
            password="testpassword",
            is_active=True,
            role="admin"
        )
        self.regular_user = UserFactory(
            email="regular_orders@example.com",
            password="testpassword",
            is_active=True,
            role="member"
        )
        self.order1 = OrderFactory(created_by=self.regular_user, status=Order.OrderStatus.PENDING)
        self.order2 = OrderFactory(created_by=self.regular_user, status=Order.OrderStatus.COMPLETED)
        
        from rest_framework.test import APIClient
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)

    def test_admin_list_orders(self):
        url = reverse("v1:checkout:admin_order_list")
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see all orders regardless of creator
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)
        
    def test_regular_user_list_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.regular_user)
        url = reverse("v1:checkout:admin_order_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_update_order_status(self):
        url = reverse("v1:checkout:admin_order_update", kwargs={"pk": self.order1.id})
        payload = {"status": Order.OrderStatus.CANCELLED}
        response = self.admin_client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify it updated
        self.assertEqual(response.data["status"], Order.OrderStatus.CANCELLED)
        self.order1.refresh_from_db()
        self.assertEqual(self.order1.status, Order.OrderStatus.CANCELLED)

    def test_regular_user_update_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.regular_user)
        url = reverse("v1:checkout:admin_order_update", kwargs={"pk": self.order1.id})
        payload = {"status": Order.OrderStatus.CANCELLED}
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminShippingAddressTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.admin_user = UserFactory(
            email="admin_addresses@example.com",
            password="testpassword",
            is_active=True,
            role="admin"
        )
        self.regular_user = UserFactory(
            email="regular_addresses@example.com",
            password="testpassword",
            is_active=True,
            role="member"
        )
        self.address1 = ShippingAddressFactory(user=self.admin_user)
        self.address2 = ShippingAddressFactory(user=self.admin_user)
        # Address from a different user to prove global listing
        self.regular_address = ShippingAddressFactory(user=self.regular_user)

        from rest_framework.test import APIClient
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)

    def test_admin_list_shipping_addresses(self):
        url = reverse("v1:checkout:admin_shipping_address_list")
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Admin should see addresses from both users
        address_ids = [str(r['id']) for r in results]
        self.assertIn(str(self.address1.id), address_ids)
        self.assertIn(str(self.address2.id), address_ids)
        self.assertIn(str(self.regular_address.id), address_ids)

        # Verify descending ordering by created_at
        created_dates = [r['created_at'] for r in results]
        self.assertEqual(created_dates, sorted(created_dates, reverse=True))

    def test_regular_user_list_shipping_addresses_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.regular_user)
        url = reverse("v1:checkout:admin_shipping_address_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_list_shipping_addresses(self):
        url = reverse("v1:checkout:admin_shipping_address_list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AdminPaymentTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.admin_user = UserFactory(
            email="admin_payments@example.com",
            password="testpassword",
            is_active=True,
            role="admin"
        )
        self.regular_user = UserFactory(
            email="regular_payments@example.com",
            password="testpassword",
            is_active=True,
            role="member"
        )
        # Create a payment belonging to the admin user
        self.order = OrderFactory(created_by=self.admin_user)
        self.payment = PaymentFactory(
            order=self.order,
            created_by=self.admin_user,
            amount=Decimal("99.99"),
            payment_status="paid"
        )
        # Create a payment belonging to a non-admin user
        self.regular_order = OrderFactory(created_by=self.regular_user)
        self.regular_payment = PaymentFactory(
            order=self.regular_order,
            created_by=self.regular_user,
            amount=Decimal("49.99"),
            payment_status="pending"
        )

        from rest_framework.test import APIClient
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)

    def test_admin_list_payments(self):
        url = reverse("v1:checkout:admin_payment_list")
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        # Admin should see payments from both the admin and regular user
        payment_ids = [str(r['id']) for r in results]
        self.assertIn(str(self.payment.id), payment_ids)
        self.assertIn(str(self.regular_payment.id), payment_ids)

    def test_regular_user_list_payments_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.regular_user)
        url = reverse("v1:checkout:admin_payment_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
