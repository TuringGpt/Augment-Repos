from django.urls import reverse
from rest_framework import status

from accounts.factory import UserFactory
from core.tests import BaseAPITestCase

from .factory import CommentFactory, TicketFactory


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

    def test_list_tickets(self):
        # GIVEN an authenticated user exists
        # WHEN we make a get request to list tickets
        url = reverse("v1:ticket:ticket_list")
        response = self.authenticated_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)

    def test_ticket_detail(self):
        # GIVEN an authenticated user exists
        # WHEN we make a get request to retrieve ticket details
        url = reverse("v1:ticket:ticket_detail", args=[self.ticket.id])
        response = self.authenticated_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.ticket.id))
        self.assertEqual(response.data["title"], "Test Title")
        self.assertEqual(response.data["description"], "Test Description")
        self.assertEqual(response.data["status"], "Test Status")
        self.assertEqual(response.data["priority"], "Test Priority")
        self.assertEqual(response.data["assignee"], self.user.id)
        self.assertEqual(response.data["reporter"], self.user.id)

    def test_update_ticket(self):
        # GIVEN an authenticated user exists
        # WHEN we make a put request to update ticket details
        url = reverse("v1:ticket:update_ticket", args=[self.ticket.id])
        payload = {
            "title": "Updated Title",
            "description": "Updated Description",
            "status": "Updated Status",
            "priority": "Updated Priority",
            "assignee": self.user2.id,
        }
        response = self.authenticated_client.put(url, payload)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")
        self.assertEqual(response.data["description"], "Updated Description")
        self.assertEqual(response.data["status"], "Updated Status")
        self.assertEqual(response.data["priority"], "Updated Priority")
        self.assertEqual(response.data["assignee"], self.user2.id)

    def test_add_comment(self):
        # GIVEN an authenticated user exists
        # WHEN we make a post request to add a comment to a ticket
        url = reverse("v1:ticket:create_comment", args=[self.ticket.id])
        payload = {
            "content": "New Comment Content",
        }
        response = self.authenticated_client.post(url, payload)

        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "New Comment Content")
        self.assertEqual(response.data["ticket"], self.ticket.id)

    def test_list_comments(self):
        # GIVEN an authenticated user exists
        # WHEN we make a get request to list comments for a ticket
        url = reverse("v1:ticket:comment_list", args=[self.ticket.id])
        response = self.authenticated_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)
        self.assertEqual(response.data["results"][0]["content"], "Test Content")
        self.assertEqual(response.data["results"][0]["user"], self.user.id)
        self.assertEqual(response.data["results"][0]["ticket"], self.ticket.id)

    def test_delete_ticket(self):
        # GIVEN an authenticated user exists
        # WHEN we make a delete request to delete a ticket
        url = reverse("v1:ticket:delete_ticket", args=[self.ticket.id])
        response = self.authenticated_client.delete(url)

        # THEN we should get a 204 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # AND the ticket should no longer exist
        url = reverse("v1:ticket:ticket_detail", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_comment(self):
        # GIVEN an authenticated user exists
        # WHEN we make a delete request to delete a comment
        url = reverse("v1:ticket:delete_comment", args=[self.ticket.id, self.comment.id])
        response = self.authenticated_client.delete(url)

        # THEN we should get a 204 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # AND the comment should no longer exist
        url = reverse("v1:ticket:comment_list", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comments = response.data.get("results", [])
        self.assertFalse(any(c["id"] == str(self.comment.id) for c in comments))
