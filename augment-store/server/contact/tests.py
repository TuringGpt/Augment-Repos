from core.tests import BaseAPITestCase
from accounts.factory import UserFactory
from rest_framework import status
from django.urls import reverse
from contact.models import ContactMessage
from contact.factory import ContactMessageFactory
from accounts.models import User

# Create your tests here.
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
        # GIVEN an unauthenticated user exists
        # WHEN we make a post request to create a contact message
        url = reverse("v1:create_contact")
        payload = {
            "name": "Test Name",
            "email": "test@example.com",
            "message": "Test Message",
        }
        response = self.client.post(url, payload)
        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # AND a ContactMessage object should be created in the database
        self.assertTrue(ContactMessage.objects.filter(name="Test Name").exists())
        # AND the response should contain created_at and status fields
        self.assertIn("created_at", response.data)
        self.assertIn("status", response.data)
        self.assertEqual(response.data["status"], ContactMessage.Status.UNREAD)

    def test_list_contact_messages(self):
        # GIVEN an authenticated admin exists
        self.authenticated_client.force_authenticate(user=self.admin)
        # AND some contact messages exist in the database
        ContactMessageFactory(
            name="Test Name 1",
            email="test1@example.com",
            message="Test Message 1",
        )
        ContactMessageFactory(
            name="Test Name 2",
            email="test2@example.com",
            message="Test Message 2",
        )
        # WHEN we make a get request to list contact messages
        url = reverse("v1:contact_list")
        response = self.authenticated_client.get(url)
        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # AND the response should contain the contact messages
        self.assertEqual(len(response.data.get("results", [])), 2)
        self.assertEqual(response.data["results"][0]["name"], "Test Name 2")
        self.assertEqual(response.data["results"][1]["name"], "Test Name 1")
        # AND each contact message should have created_at and status fields
        for result in response.data["results"]:
            self.assertIn("created_at", result)
            self.assertIn("status", result)
        
    def test_retrieve_contact_message(self):
        # GIVEN an authenticated admin exists
        self.authenticated_client.force_authenticate(user=self.admin)
        # AND a contact message exists in the database
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            message="Test Message",
        )
        # WHEN we make a get request to retrieve the contact message
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        response = self.authenticated_client.get(url)
        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # AND the response should contain the contact message details
        self.assertEqual(response.data["name"], "Test Name")
        # AND the response should contain created_at and status fields
        self.assertIn("created_at", response.data)
        self.assertIn("status", response.data)

    def test_delete_contact_message(self):
        # GIVEN an authenticated admin exists
        self.authenticated_client.force_authenticate(user=self.admin)
        # AND a contact message exists in the database
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            message="Test Message",
        )
        # WHEN we make a delete request to delete the contact message
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        response = self.authenticated_client.delete(url)
        # THEN we should get a 204 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # AND the contact message should be deleted from the database
        self.assertFalse(ContactMessage.objects.filter(id=contact_message.id).exists())

    def test_update_contact_message(self):
        # GIVEN an authenticated admin exists
        self.authenticated_client.force_authenticate(user=self.admin)
        # AND a contact message exists in the database
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            message="Test Message",
        )
        # WHEN we make a patch request to update the contact message
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        payload = {
            "name": "Updated Name",
        }
        response = self.authenticated_client.patch(url, payload)
        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # AND the contact message should be updated in the database
        contact_message.refresh_from_db()
        self.assertEqual(contact_message.name, "Updated Name")

    def test_update_contact_message_status(self):
        # GIVEN an authenticated admin exists
        self.authenticated_client.force_authenticate(user=self.admin)
        # AND a contact message exists in the database with unread status
        contact_message = ContactMessageFactory(
            name="Test Name",
            email="test@example.com",
            message="Test Message",
        )
        self.assertEqual(contact_message.status, ContactMessage.Status.UNREAD)
        # WHEN we make a patch request to update the status to read
        url = reverse("v1:contact_detail", kwargs={"pk": str(contact_message.id)})
        payload = {
            "status": ContactMessage.Status.READ,
        }
        response = self.authenticated_client.patch(url, payload)
        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # AND the contact message status should be updated in the database
        contact_message.refresh_from_db()
        self.assertEqual(contact_message.status, ContactMessage.Status.READ)
        # AND the response should contain the updated status
        self.assertEqual(response.data["status"], ContactMessage.Status.READ)

    def test_list_contact_message_unauthenticated(self):
        # GIVEN an unauthenticated user exists
        # WHEN we make a get request to list contact messages
        url = reverse("v1:contact_list")
        response = self.client.get(url)
        # THEN we should get a 401 response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)




    def test_create_contact_message_ignores_status(self):
        # GIVEN an unauthenticated user exists
        # WHEN we make a post request to create a contact message with a specific status
        url = reverse("v1:create_contact")
        payload = {
            "name": "Test Name",
            "email": "test@example.com",
            "message": "Test Message",
            "status": ContactMessage.Status.RESOLVED # Attempt to set status to resolved
        }
        response = self.client.post(url, payload)
        # THEN we should get a 201 response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # AND the contact message should be created with the default status (UNREAD)
        contact_message = ContactMessage.objects.get(name="Test Name")
        self.assertEqual(contact_message.status, ContactMessage.Status.UNREAD)
