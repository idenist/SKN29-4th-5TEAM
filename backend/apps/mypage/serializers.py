from rest_framework import serializers


class MypageSummarySerializer(serializers.Serializer):
    """
    GET /api/mypage/ 요약 응답 형식.
    실제 값은 view에서 각 앱 데이터를 모아 채워 넣는다.
    """

    profile = serializers.DictField()
    scrap_count = serializers.IntegerField()
    recent_searches = serializers.ListField(child=serializers.CharField())
    recent_viewed_policies = serializers.ListField(child=serializers.DictField())
    unread_notification_count = serializers.IntegerField()