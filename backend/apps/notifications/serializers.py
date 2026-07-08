# apps/notifications/serializers.py

from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    policy_title = serializers.CharField(source="policy.title", read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "policy",
            "policy_title",
            "link",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields