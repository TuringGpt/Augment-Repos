from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from accounts.models import User
from rest_framework import status
from rest_framework.test import APIClient
from django.urls import reverse
from products.factory import ProductFactory
from carts.factory import CartItemFactory
from carts.models import Cart
from checkout.models import Order, OrderItem
from checkout.factory import OrderFactory, OrderItemFactory
from decimal import Decimal


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
        self.assertIn("product", order_item["cart_item"])

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

        # AND the order items should be included with cart item details
        order_items = response.data["items"]
        self.assertIn("cart_item", order_items[0])
        self.assertIn("product", order_items[0]["cart_item"])

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
