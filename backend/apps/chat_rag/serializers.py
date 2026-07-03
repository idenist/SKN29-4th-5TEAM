# backend/apps/chat_rag/serializers.py

from rest_framework import serializers


class UserProfileInputSerializer(serializers.Serializer):
    age = serializers.IntegerField(required=False, allow_null=True)
    region = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    income = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    employment_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    interest_domain = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    interests = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
    )


class AIChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(required=True, allow_blank=False)
    user_profile = UserProfileInputSerializer(required=False, allow_null=True)
    top_k = serializers.IntegerField(required=False, min_value=1, max_value=20, default=5)
    conversation_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)