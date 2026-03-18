from core.tests import BaseAPITestCase
from django.urls import reverse
from rest_framework import status
from notifications.factories import NotificationFactory
from notifications.models import Notification
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.core.cache import cache
from unittest.mock import patch

class NotificationTests(BaseAPITestCase):
    def test_list_notifications(self):
        # GIVEN an authenticated user exists 
        self.authenticated_client.force_authenticate(user=self.user)
        # AND the user has notifications
        NotificationFactory(user=self.user)
        NotificationFactory(user=self.user)

        # WHEN we make a get request to list notifications
        url = reverse("v1:notifications:list_notification")
        response = self.authenticated_client.get(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the response should contain the notifications
        self.assertEqual(len(response.data.get("results", [])), 2)

    def test_list_notifications_field_presence(self):
        self.authenticated_client.force_authenticate(user=self.user)
        NotificationFactory(user=self.user)
        url = reverse("v1:notifications:list_notification")
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertGreater(len(results), 0)
        result = results[0]
        self.assertIn("id", result)
        self.assertIn("title", result)
        self.assertIn("is_read", result)
        self.assertIn("created_at", result)
        self.assertNotIn("is_deleted", result)

    def test_list_notifications_filter_by_is_read(self):
        self.authenticated_client.force_authenticate(user=self.user)
        from notifications.views import NotificationCacheService
        NotificationCacheService().clear_namespace()
        NotificationFactory(user=self.user, is_read=True)
        NotificationFactory(user=self.user, is_read=False)

        url = reverse("v1:notifications:list_notification")
        
        # Test filter unread
        response = self.authenticated_client.get(url, {"is_read": "false"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertFalse(r["is_read"])

        # Test filter read
        response = self.authenticated_client.get(url, {"is_read": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", [])
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertTrue(r["is_read"])

    def test_list_notifications_filter_by_is_read_invalid(self):
        self.authenticated_client.force_authenticate(user=self.user)
        url = reverse("v1:notifications:list_notification")
        response = self.authenticated_client.get(url, {"is_read": "not_a_boolean"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("is_read", response.data)

    def test_mark_notification_as_read(self):
        # GIVEN an authenticated user exists 
        self.authenticated_client.force_authenticate(user=self.user)

        # AND the user has an unread notification
        notification = NotificationFactory(user=self.user, is_read=False)

        # WHEN we make a patch request to mark the notification as read
        url = reverse("v1:notifications:update_notification", kwargs={"pk": str(notification.id)})
        response = self.authenticated_client.patch(url, {"is_read": True})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND the notification should be marked as read
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_delete_notification(self):
        # GIVEN an authenticated user exists
        self.authenticated_client.force_authenticate(user=self.user)

        # AND the user has an unread notification
        notification = NotificationFactory(user=self.user, is_read=False)

        # WHEN we make a delete request to delete the notifiction 
        url = reverse("v1:notifications:update_notification", kwargs={"pk": str(notification.id)})
        response = self.authenticated_client.delete(url)

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # THEN the notification should be delete
        self.assertEqual(Notification.objects.get_user_notifications(self.user).count(), 0)

    def test_mark_all_notifications_as_read(self):
        # GIVEN an authenticated user exists 
        self.authenticated_client.force_authenticate(user=self.user)

        # AND the user has an unread notification
        NotificationFactory(user=self.user, is_read=False)
        NotificationFactory(user=self.user, is_read=False)

        # WHEN we make a patch request to mark the notification as read
        url = reverse("v1:notifications:mark_all_as_read")
        response = self.authenticated_client.patch(url, {"mark_all_as_read": True})

        # THEN we should get a 200 response
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # AND all notifications should be marked as read
        self.assertEqual(Notification.objects.get_user_notifications(self.user).filter(is_read=False).count(), 0)
        self.assertEqual(Notification.objects.get_user_notifications(self.user).filter(is_read=True).count(), 2)

        # AND the response should contain the notifications
        self.assertEqual(len(response.data.get("notifications", [])), 2)


class NotificationCacheTests(BaseAPITestCase):
    """Tests for notification caching behavior."""

    def setUp(self):
        super().setUp()
        from notifications.views import NotificationCacheService
        self.cache_service = NotificationCacheService()
        # Get table name from model metadata for database-agnostic checks
        self.notification_table = Notification._meta.db_table
        # Clear both namespace and full cache for LocMemCache compatibility
        self.cache_service.clear_namespace()
        cache.clear()

    def _get_notification_queries(self, captured_queries):
        """Helper to find notification table queries in a database-agnostic way."""
        table_name = self.notification_table.lower()
        return [
            q for q in captured_queries
            if q.get('sql') and table_name in q['sql'].lower()
        ]

    def test_list_notifications_cached(self):
        # GIVEN an authenticated user with notifications
        self.authenticated_client.force_authenticate(user=self.user)
        NotificationFactory(user=self.user)
        NotificationFactory(user=self.user)

        url = reverse("v1:notifications:list_notification")

        # WHEN making first request (cache miss)
        with CaptureQueriesContext(connection) as ctx1:
            response_1 = self.authenticated_client.get(url)
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)
        
        # Verify first request hit the database (cache miss)
        notification_queries_1 = self._get_notification_queries(ctx1.captured_queries)
        self.assertGreater(len(notification_queries_1), 0, "First request should query database (cache miss)")

        # WHEN making second request (cache hit)
        with CaptureQueriesContext(connection) as ctx2:
            response_2 = self.authenticated_client.get(url)
        self.assertEqual(response_2.status_code, status.HTTP_200_OK)

        # THEN responses should be identical
        self.assertEqual(response_1.data, response_2.data)
        
        # AND second request should have fewer notification queries (cache hit)
        notification_queries_2 = self._get_notification_queries(ctx2.captured_queries)
        self.assertLess(len(notification_queries_2), len(notification_queries_1), 
                        "Second request should have fewer DB queries (cache hit)")

    @patch('notifications.views.NotificationCacheService.clear_namespace')
    def test_cache_invalidated_on_update(self, mock_clear_namespace):
        # GIVEN an authenticated user with a notification
        self.authenticated_client.force_authenticate(user=self.user)
        notification = NotificationFactory(user=self.user, is_read=False)

        list_url = reverse("v1:notifications:list_notification")
        update_url = reverse("v1:notifications:update_notification", kwargs={"pk": str(notification.id)})

        # WHEN listing notifications (populates cache)
        response_1 = self.authenticated_client.get(list_url)
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)
        self.assertFalse(response_1.data["results"][0]["is_read"])

        # AND updating the notification (should invalidate cache)
        update_response = self.authenticated_client.patch(update_url, {"is_read": True})
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # THEN cache invalidation should have been called
        mock_clear_namespace.assert_called()
        
        # AND the database should reflect the update
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    @patch('notifications.views.NotificationCacheService.clear_namespace')
    def test_cache_invalidated_on_mark_all_read(self, mock_clear_namespace):
        # GIVEN an authenticated user with unread notifications
        self.authenticated_client.force_authenticate(user=self.user)
        NotificationFactory(user=self.user, is_read=False)
        NotificationFactory(user=self.user, is_read=False)

        list_url = reverse("v1:notifications:list_notification")
        mark_all_url = reverse("v1:notifications:mark_all_as_read")

        # WHEN listing notifications (populates cache)
        response_1 = self.authenticated_client.get(list_url)
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)
        unread_count_before = sum(1 for n in response_1.data["results"] if not n["is_read"])
        self.assertEqual(unread_count_before, 2)

        # AND marking all as read (should invalidate cache)
        mark_response = self.authenticated_client.patch(mark_all_url, {"mark_all_as_read": True})
        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        
        # THEN cache invalidation should have been called
        mock_clear_namespace.assert_called()
        
        # AND the database should reflect the update
        unread_in_db = Notification.objects.filter(user=self.user, is_read=False).count()
        self.assertEqual(unread_in_db, 0)


class UnreadNotificationCountTests(BaseAPITestCase):
    """Tests for unread notification count endpoint."""

    def setUp(self):
        super().setUp()
        from notifications.views import NotificationCountCacheService
        NotificationCountCacheService().clear_namespace()
        cache.clear()
        self.count_url = reverse("v1:notifications:unread_notification_count")

    def test_unread_count_returns_correct_value(self):
        self.authenticated_client.force_authenticate(user=self.user)
        NotificationFactory(user=self.user, is_read=False)
        NotificationFactory(user=self.user, is_read=False)
        NotificationFactory(user=self.user, is_read=True)

        response = self.authenticated_client.get(self.count_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["unread_count"], 2)

    def test_unread_count_updates_after_mark_as_read(self):
        self.authenticated_client.force_authenticate(user=self.user)
        NotificationFactory(user=self.user, is_read=False)
        NotificationFactory(user=self.user, is_read=False)

        # Prime the cache
        response = self.authenticated_client.get(self.count_url)
        self.assertEqual(response.data["unread_count"], 2)

        # Mark all as read
        mark_url = reverse("v1:notifications:mark_all_as_read")
        self.authenticated_client.patch(mark_url, {"mark_all_as_read": True})

        # Count should now be 0
        response = self.authenticated_client.get(self.count_url)
        self.assertEqual(response.data["unread_count"], 0)

    def test_unread_count_updates_after_delete(self):
        self.authenticated_client.force_authenticate(user=self.user)
        notification = NotificationFactory(user=self.user, is_read=False)

        # Prime the cache
        response = self.authenticated_client.get(self.count_url)
        self.assertEqual(response.data["unread_count"], 1)

        # Delete the notification
        delete_url = reverse("v1:notifications:update_notification", kwargs={"pk": str(notification.id)})
        self.authenticated_client.delete(delete_url)

        # Count should now be 0
        response = self.authenticated_client.get(self.count_url)
        self.assertEqual(response.data["unread_count"], 0)

class AdminNotificationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        from accounts.factories import UserFactory
        self.admin = UserFactory(role="admin", email="admin_notif@example.com")
        
    def test_admin_list_notifications(self):
        NotificationFactory.create_batch(3, user=self.user)
        
        self.authenticated_client.force_authenticate(user=self.admin)
        url = reverse('v1:notifications:admin_notification_list')
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 3)
        
        # Test non-admin fails
        self.authenticated_client.force_authenticate(user=self.user)
        response = self.authenticated_client.get(url)
        self.assertEqual(response.status_code, 403)
        
    def test_admin_update_notification(self):
        notification = NotificationFactory(user=self.user, is_read=False)
        
        self.authenticated_client.force_authenticate(user=self.admin)
        url = reverse('v1:notifications:admin_notification_update', kwargs={'pk': notification.pk})
        
        response = self.authenticated_client.patch(url, {'is_read': True})
        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        
        # Test non-admin fails
        self.authenticated_client.force_authenticate(user=self.user)
        response = self.authenticated_client.patch(url, {'is_read': False})
        self.assertEqual(response.status_code, 403)
