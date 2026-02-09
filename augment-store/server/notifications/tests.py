from core.tests import BaseAPITestCase
from django.urls import reverse
from rest_framework import status
from notifications.factories import NotificationFactory
from notifications.models import Notification

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
        self.cache_service.clear_namespace()

    def test_list_notifications_cached(self):
        # GIVEN an authenticated user with notifications
        self.authenticated_client.force_authenticate(user=self.user)
        NotificationFactory(user=self.user)
        NotificationFactory(user=self.user)

        url = reverse("v1:notifications:list_notification")

        # WHEN making first request
        response_1 = self.authenticated_client.get(url)
        self.assertEqual(response_1.status_code, status.HTTP_200_OK)

        # WHEN making second request
        response_2 = self.authenticated_client.get(url)
        self.assertEqual(response_2.status_code, status.HTTP_200_OK)

        # THEN responses should be identical (cached)
        self.assertEqual(response_1.data, response_2.data)

    def test_cache_invalidated_on_update(self):
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
        self.authenticated_client.patch(update_url, {"is_read": True})

        # THEN subsequent list should reflect the update
        response_2 = self.authenticated_client.get(list_url)
        self.assertEqual(response_2.status_code, status.HTTP_200_OK)
        self.assertTrue(response_2.data["results"][0]["is_read"])

    def test_cache_invalidated_on_mark_all_read(self):
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
        self.authenticated_client.patch(mark_all_url, {"mark_all_as_read": True})

        # THEN subsequent list should show all as read
        response_2 = self.authenticated_client.get(list_url)
        self.assertEqual(response_2.status_code, status.HTTP_200_OK)
        unread_count_after = sum(1 for n in response_2.data["results"] if not n["is_read"])
        self.assertEqual(unread_count_after, 0)

