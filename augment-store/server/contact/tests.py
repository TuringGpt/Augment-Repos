from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from rest_framework import status
from django.urls import reverse
from contact.models import ContactMessage
from contact.factory import ContactMessageFactory
from accounts.models import User

class ContactTests(BaseAPITestCase):
    
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(
            email="admin@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.ADMIN
        )

    def test_create_contact_message(self):
        url = reverse("v1:create_contact")
        payload = {
            "name": "Test Name",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "Test Message",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ContactMessage.objects.filter(name="Test Name").exists())
        self.assertIn("created_at", response.data)
        self.assertIn("status", response.data)
        self.assertEqual(response.data["subject"], "Test Subject")
        self.assertEqual(response.data["status"], ContactMessage.Status.UNREAD)
        contact_message = ContactMessage.objects.get(name="Test Name")
        self.assertEqual(contact_message.subject, "Test Subject")

    def test_list_contact_messages(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        ContactMessageFactory(
            name="Test Name 1",
            email="test1@example.com",
            subject="Subject 1",
            message="Test Message 1",
        )
        ContactMessageFactory(
            name="Test Name 2",
            email="test2@example.com",
            subject="Subject 2",
            message="Test Message 2",
        )
        url = reverse("v1:contact_list")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 2)
        self.assertEqual(response.data["results"][0]["name"], "Test Name 2")
        self.assertEqual(response.data["results"][1]["name"], "Test Name 1")
        for result in response.data["results"]:
            self.assertIn("created_at", result)
            self.assertIn("status", result)
        self.assertEqual(response.data["results"][0]["subject"], "Subject 2")
        self.assertEqual(response.data["results"][1]["subject"], "Subject 1")
        
    def test_retrieve_contact_message(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            subject="Test Subject",
            message="Test Message",
        )
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Name")
        self.assertIn("created_at", response.data)
        self.assertIn("status", response.data)
        self.assertEqual(response.data["subject"], "Test Subject")

    def test_delete_contact_message(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            subject="Test Subject",
            message="Test Message",
        )
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        response = self.authenticated_client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ContactMessage.objects.filter(id=contact_message.id).exists())

    def test_update_contact_message(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            subject="Test Subject",
            message="Test Message",
        )
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        payload = {
            "name": "Updated Name",
        }
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contact_message.refresh_from_db()
        self.assertEqual(contact_message.name, "Updated Name")

    def test_update_contact_message_status(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            subject="Test Subject",
            message="Test Message",
        )
        self.assertEqual(contact_message.status, ContactMessage.Status.UNREAD)
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        payload = {
            "status": ContactMessage.Status.READ,
        }
        response = self.authenticated_client.patch(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contact_message.refresh_from_db()
        self.assertEqual(contact_message.status, ContactMessage.Status.READ)
        self.assertEqual(response.data["status"], ContactMessage.Status.READ)

    def test_list_contact_message_unauthenticated(self):
        url = reverse("v1:contact_list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_contact_message_ignores_status(self):
        url = reverse("v1:create_contact")
        payload = {
            "name": "Test Name",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "Test Message",
            "status": ContactMessage.Status.RESOLVED
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contact_message = ContactMessage.objects.get(name="Test Name")
        self.assertEqual(contact_message.status, ContactMessage.Status.UNREAD)
