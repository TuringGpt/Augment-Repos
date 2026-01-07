from django.urls import reverse
from rest_framework import status

from core.tests import BaseAPITestCase
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
