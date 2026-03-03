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
        self.authenticated_client.force_authenticate(user=self.user)
        self.user2 = UserFactory(
            email="test2@example.com",
            password="testpassword",
            is_active=True,
        )
        self.ticket = TicketFactory(
            title="Test Title",
            description="Test Description",
            status=Ticket.Status.OPEN,
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
            "status": Ticket.Status.OPEN,
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
            "status": Ticket.Status.OPEN,
            "priority": "not_a_valid_priority",
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("priority", response.data)

    def test_create_ticket_default_priority(self):
        url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "Default Priority Ticket",
            "description": "Should get default priority",
            "status": Ticket.Status.OPEN,
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["priority"], Ticket.Priority.LOW)

    def test_create_ticket_with_invalid_status(self):
        url = reverse("v1:ticket:create_ticket")
        payload = {
            "title": "Bad Ticket",
            "description": "Bad Description",
            "status": "not_a_valid_status",
            "priority": Ticket.Priority.LOW,
            "assignee": str(self.user.id),
        }
        response = self.authenticated_client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_list_tickets(self):
        url = reverse("v1:ticket:ticket_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get("results", [])), 1)

    def test_list_tickets_filter_by_status(self):
        TicketFactory(status=Ticket.Status.CLOSED, assignee=self.user, reporter=self.user)
        url = reverse("v1:ticket:ticket_list")
        response = self.authenticated_client.get(url, {"status": Ticket.Status.OPEN})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertGreater(len(results), 0)
        for ticket in results:
            self.assertEqual(ticket["status"], Ticket.Status.OPEN)

    def test_list_tickets_filter_by_status_no_match(self):
        url = reverse("v1:ticket:ticket_list")
        response = self.authenticated_client.get(url, {"status": Ticket.Status.RESOLVED})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 0)
    
    def test_ticket_detail(self):
        url = reverse("v1:ticket:ticket_detail", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(self.ticket.id))  
        self.assertEqual(response.data["title"], "Test Title")  
        self.assertEqual(response.data["description"], "Test Description")  
        self.assertEqual(response.data["status"], Ticket.Status.OPEN)  
        self.assertEqual(response.data["priority"], Ticket.Priority.HIGH)  
        self.assertEqual(response.data["assignee"], self.user.id)  
        self.assertEqual(response.data["reporter"], self.user.id)  

    def test_ticket_detail_excludes_is_deleted(self):
        url = reverse("v1:ticket:ticket_detail", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("is_deleted", response.data)
        self.assertIn("created_at", response.data)
        self.assertIn("updated_at", response.data)

    def test_list_tickets_includes_created_at(self):
        url = reverse("v1:ticket:ticket_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data.get("results", []):
            self.assertIn("created_at", result)
            self.assertNotIn("is_deleted", result)

    def test_update_ticket(self):
        url = reverse("v1:ticket:update_ticket", args=[self.ticket.id])
        payload = {
            "title": "Updated Title",
            "description": "Updated Description",
            "status": Ticket.Status.IN_PROGRESS,
            "priority": Ticket.Priority.URGENT,
            "assignee": self.user2.id,
        }
        response = self.authenticated_client.put(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")  
        self.assertEqual(response.data["description"], "Updated Description")  
        self.assertEqual(response.data["status"], Ticket.Status.IN_PROGRESS)  
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
    
    def test_list_comments_excludes_is_deleted(self):
        url = reverse("v1:ticket:comment_list", args=[self.ticket.id])
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for comment in response.data.get("results", []):
            self.assertNotIn("is_deleted", comment)
            self.assertIn("created_at", comment)
    
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
        TicketFactory(reporter=self.user, assignee=self.user, status=Ticket.Status.OPEN)
        TicketFactory(reporter=self.user, assignee=self.user, status=Ticket.Status.CLOSED)
        TicketFactory(reporter=self.other_user, assignee=self.other_user, status=Ticket.Status.OPEN)

        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["open"], 1)
        self.assertEqual(response.data["closed"], 1)

    def test_stats_all_known_statuses(self):
        for s in Ticket.Status.values:
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
            "status": Ticket.Status.OPEN,
            "priority": Ticket.Priority.HIGH,
            "assignee": str(self.user.id),
        }
        create_response = self.authenticated_client.post(create_url, payload)
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        response = self.authenticated_client.get(self.stats_url)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["open"], 1)
