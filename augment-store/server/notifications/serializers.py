from rest_framework import serializers

from .models import Notification


class NotificationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"

class UpdateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["is_read"]

    def update(self, instance, validated_data):
        instance.is_read = validated_data.get("is_read", instance.is_read)
        instance.save()
        return instance


class MarkAsReadSerializer(serializers.Serializer):
    mark_all_as_read = serializers.BooleanField(default=False, required=False, write_only=True)
    notification_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class TempSerializer(serializers.ModelSerializer):

        class Meta:
            model = Notification
            fields = ["id", "is_read"]

    def validate_notification_ids(self, value):
        user = self.context.get("request").user
        notifications = Notification.objects.get_user_notifications(user).filter(id__in=value)

        invalid_ids = []
        for id in value:
            if not notifications.filter(id=id).exists():
                invalid_ids.append(id)

        if len(invalid_ids):
            raise serializers.ValidationError(f"Notification {invalid_ids} does not exist")

        return notifications

    def validate(self, attrs):
        mark_all_as_read = attrs.get("mark_all_as_read")
        notification_ids = attrs.get("notification_ids")

        if mark_all_as_read and notification_ids:
            raise serializers.ValidationError("Cannot provide both mark_all_as_read and notification_ids")

        if not mark_all_as_read and not notification_ids:
            raise serializers.ValidationError("Must provide either mark_all_as_read or notification_ids")

        return attrs

    def update(self, instance, validated_data):
        mark_all_as_read = validated_data.get("mark_all_as_read")
        notification_ids = validated_data.get("notification_ids")
        user = self.context.get("request").user

        if mark_all_as_read:
            notifications = Notification.objects.get_user_notifications(user).filter(is_read=False)
        else:
            notifications = Notification.objects.get_user_notifications(user).filter(id__in=notification_ids)

        for notification in notifications:
            notification.is_read = True

        count = Notification.objects.bulk_update(notifications, ["is_read"], batch_size=100)

        return {
            "count": count,
            "notifications": self.TempSerializer(notifications, many=True).data
        }

