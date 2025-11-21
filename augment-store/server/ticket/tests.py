from core.tests import BaseAPITestCase
from django.urls import reverse
from rest_framework import status
from .factory import TicketFactory, CommentFactory
from accounts.factory import UserFactory

# Create your tests here.
class TicketTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.user = UserFactory(
            email="test@example.com",
            password="testpassword",
            is_active=True,
        )
        self.user2 = UserFactory(
            email="test2@example.com",
            password="testpassword",
            is_active=True,
        )
        self.ticket = TicketFactory(
            title="Test Title",
            description="Test Description",
            status="Test Status",
            priority="Test Priority",
            assignee=self.user,
            reporter=self.user,
        )
        self.comment = CommentFactory(
            ticket=self.ticket,
            user=self.user,
            content="Test Content",
        )

    def test_create_ticket(self):
        # GIVEN an authenticated user exists
        # WHEN we make a post request to create a ticket
        url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "New Ticket",
            "description": "New Ticket Description",
            "status": "New Ticket Status",
            "priority": "New Ticket Priority",
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload) 

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

