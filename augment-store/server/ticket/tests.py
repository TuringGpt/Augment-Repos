from core.tests import BaseAPITestCase
from django.urls import reverse
from rest_framework import status
from .factory import TicketFactory, CommentFactory
from .models import Ticket
from accounts.factory import UserFactory

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
            priority=Ticket.Priority.HIGH,
            assignee=self.user,
            reporter=self.user,
        )
        self.comment = CommentFactory(
            ticket=self.ticket,
            user=self.user,
            content="Test Content",
        )

    def test_create_ticket(self):
        url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "New Ticket",
            "description": "New Ticket Description",
            "status": "New Ticket Status",
            "priority": Ticket.Priority.MEDIUM,
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload) 
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["priority"], Ticket.Priority.MEDIUM)

    def test_create_ticket_with_invalid_priority(self):
        url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "Bad Ticket",
            "description": "Bad Description",
            "status": "open",
            "priority": "not_a_valid_priority",
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_ticket_default_priority(self):
        url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "Default Priority Ticket",
            "description": "Should get default priority",
            "status": "open",
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["priority"], Ticket.Priority.LOW)

    def test_list_tickets(self):
        url = reverse("v1:ticket:ticket_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)
    
    def test_ticket_detail(self):
        url = reverse("v1:ticket:ticket_detail", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.ticket.id))  
        self.assertEqual(response.data["title"], "Test Title")  
        self.assertEqual(response.data["description"], "Test Description")  
        self.assertEqual(response.data["status"], "Test Status")
        self.assertEqual(response.data["priority"], Ticket.Priority.HIGH)  
        self.assertEqual(response.data["assignee"], self.user.id)  
        self.assertEqual(response.data["reporter"], self.user.id)  

    def test_update_ticket(self):
        url = reverse("v1:ticket:update_ticket", args=[self.ticket.id])
        payload = {
            "title": "Updated Title",
            "description": "Updated Description",
            "status": "Updated Status",
            "priority": Ticket.Priority.URGENT,
            "assignee": self.user2.id,
        }
        response = self.authenticated_client.put(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")  
        self.assertEqual(response.data["description"], "Updated Description")  
        self.assertEqual(response.data["status"], "Updated Status")
        self.assertEqual(response.data["priority"], Ticket.Priority.URGENT)  
        self.assertEqual(response.data["assignee"], self.user2.id)

    def test_add_comment(self):
        url = reverse("v1:ticket:create_comment", args=[self.ticket.id])
        payload = {
            "content": "New Comment Content",
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "New Comment Content")  
        self.assertEqual(response.data["ticket"], self.ticket.id)
    
    def test_list_comments(self):
        url = reverse("v1:ticket:comment_list", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)
        self.assertEqual(response.data["results"][0]["content"], "Test Content")
        self.assertEqual(response.data["results"][0]["user"], self.user.id)
        self.assertEqual(response.data["results"][0]["ticket"], self.ticket.id)
    
    def test_delete_ticket(self):
        url = reverse("v1:ticket:delete_ticket", args=[self.ticket.id])
        response = self.authenticated_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        url = reverse("v1:ticket:ticket_detail", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_comment(self):
        url = reverse("v1:ticket:delete_comment", args=[self.ticket.id, self.comment.id])
        response = self.authenticated_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        url = reverse("v1:ticket:comment_list", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comments = response.data.get("results", [])
        self.assertFalse(any(c["id"] == str(self.comment.id) for c in comments))


class TicketStatsTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.user = UserFactory(
            email="stats@example.com",
            password="testpassword",
            is_active=True,
        )
        self.other_user = UserFactory(
            email="other@example.com",
            password="testpassword",
            is_active=True,
        )
        self.authenticated_client.force_authenticate(user=self.user)
        self.stats_url = reverse("v1:ticket:ticket_stats")
        from django.core.cache import cache as django_cache
        django_cache.delete(f"ticket_stats:{self.user.id}")
        django_cache.delete(f"ticket_stats:{self.other_user.id}")

    def test_stats_per_user_scoping(self):
        TicketFactory(reporter=self.user, assignee=self.user, status="open")
        TicketFactory(reporter=self.user, assignee=self.user, status="closed")
        TicketFactory(reporter=self.other_user, assignee=self.other_user, status="open")

        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["open"], 1)
        self.assertEqual(response.data["closed"], 1)

    def test_stats_all_known_statuses(self):
        for s in ["open", "in_progress", "resolved", "closed"]:
            TicketFactory(reporter=self.user, assignee=self.user, status=s)

        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.data["total"], 4)
        self.assertEqual(response.data["open"], 1)
        self.assertEqual(response.data["in_progress"], 1)
        self.assertEqual(response.data["resolved"], 1)
        self.assertEqual(response.data["closed"], 1)
        self.assertEqual(response.data["other"], 0)

    def test_stats_other_bucket(self):
        TicketFactory(reporter=self.user, assignee=self.user, status="unknown_status")

        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["other"], 1)

    def test_stats_cache_invalidation_on_create(self):
        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.data["total"], 0)

        create_url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "New",
            "description": "Desc",
            "status": "open",
            "priority": Ticket.Priority.HIGH,
            "assignee": str(self.user.id),
        }
        create_response = self.authenticated_client.post(create_url, payload)
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["open"], 1)
