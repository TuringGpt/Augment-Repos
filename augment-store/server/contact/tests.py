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
        from .views import ContactCacheService
        ContactCacheService().clear_namespace()

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

    def test_list_contact_messages_filter_by_status(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        ContactMessageFactory(
            name="Unread Msg",
            email="unread@example.com",
            subject="Unread Subject",
            message="Unread message",
            status=ContactMessage.Status.UNREAD,
        )
        ContactMessageFactory(
            name="Read Msg",
            email="read@example.com",
            subject="Read Subject",
            message="Read message",
            status=ContactMessage.Status.READ,
        )
        url = reverse("v1:contact_list")
        response = self.authenticated_client.get(url, {"status": ContactMessage.Status.UNREAD})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertGreater(len(results), 0)
        for result in results:
            self.assertEqual(result["status"], ContactMessage.Status.UNREAD)

    def test_list_contact_messages_filter_by_status_no_match(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        ContactMessageFactory(
            name="Unread Msg",
            email="unread@example.com",
            subject="Unread Subject",
            message="Unread message",
            status=ContactMessage.Status.UNREAD,
        )
        url = reverse("v1:contact_list")
        response = self.authenticated_client.get(url, {"status": ContactMessage.Status.RESOLVED})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 0)

    def test_list_contact_messages_filter_by_invalid_status(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        url = reverse("v1:contact_list")
        response = self.authenticated_client.get(url, {"status": "invalid_status"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_search_contact_messages_by_name_or_email(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        ContactMessageFactory(
            name="Alice Cooper",
            email="alice@music.com",
            subject="Help",
            message="I need help",
        )
        ContactMessageFactory(
            name="Jane Smith",
            email="jane.smith@alice.com",
            subject="Question",
            message="I have a question",
        )
        ContactMessageFactory(
            name="Bob Ross",
            email="bob@example.com",
            subject="Painting",
            message="Happy little trees",
        )
        url = reverse("v1:contact_list")
        
        # Test search by name (Alice)
        # Matches Alice Cooper (name) and Jane Smith (email domain)
        response = self.authenticated_client.get(url, {"search": "Alice"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertEqual(len(results), 2)
        names = [r["name"] for r in results]
        self.assertIn("Alice Cooper", names)
        self.assertIn("Jane Smith", names)
        
        # Test search by email
        response = self.authenticated_client.get(url, {"search": "bob@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Bob Ross")
        
        # Test search with whitespace stripping
        response = self.authenticated_client.get(url, {"search": "   Bob   "})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Bob Ross")

    def test_search_contact_messages_no_match(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        ContactMessageFactory(
            name="Bob Ross",
            email="bob@example.com",
        )
        url = reverse("v1:contact_list")
        response = self.authenticated_client.get(url, {"search": "xyznonexistent"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 0)


class AdminContactBulkUpdateTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.admin = UserFactory(
            email="bulkadmin@demo.com",
            password="testpass123",
            is_active=True,
            role=User.Role.ADMIN
        )
        self.msg1 = ContactMessageFactory(name="Alice", status="unread")
        self.msg2 = ContactMessageFactory(name="Bob", status="unread")
        self.msg3 = ContactMessageFactory(name="Charlie", status="unread")

    def test_bulk_update_status(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        url = reverse("v1:admin_contact_bulk_update")
        response = self.authenticated_client.post(url, {
            'ids': [str(self.msg1.id), str(self.msg2.id)],
            'status': 'resolved'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['updated'], 2)

        self.msg1.refresh_from_db()
        self.msg2.refresh_from_db()
        self.msg3.refresh_from_db()
        self.assertEqual(self.msg1.status, 'resolved')
        self.assertEqual(self.msg2.status, 'resolved')
        self.assertEqual(self.msg3.status, 'unread')

    def test_bulk_update_non_admin_forbidden(self):
        self.authenticated_client.force_authenticate(user=self.user)
        url = reverse("v1:admin_contact_bulk_update")
        response = self.authenticated_client.post(url, {
            'ids': [str(self.msg1.id)],
            'status': 'read'
        }, format='json')
        self.assertEqual(response.status_code, 403)

    def test_bulk_update_empty_ids_rejected(self):
        self.authenticated_client.force_authenticate(user=self.admin)
        url = reverse("v1:admin_contact_bulk_update")
        response = self.authenticated_client.post(url, {
            'ids': [],
            'status': 'read'
        }, format='json')
        self.assertEqual(response.status_code, 400)
