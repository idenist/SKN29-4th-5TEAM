# 저장 위치: backend/apps/mypage/views.py  (덮어쓰기)
# 변경점: success_response 로컬 정의 제거 -> apps.common.responses에서 import
from rest_framework import permissions
from rest_framework.views import APIView

from apps.common.responses import success_response
from apps.notifications.models import Notification
from apps.policies.models import Scrap, SearchHistory, ViewedPolicy
from apps.users.serializers import UserProfileSerializer

from .serializers import MypageSummarySerializer


class MypageSummaryView(APIView):
    """
    GET /api/mypage/

    profile / scrap_count / recent_searches / recent_viewed_policies
    / unread_notification_count 를 한 번에 조회한다.
    새로운 모델 없이 users, policies, notifications의 기존 데이터를
    모아서 보여주기만 한다.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)

        scrap_count = Scrap.objects.filter(user=user).count()

        recent_searches = list(
            SearchHistory.objects.filter(user=user)
            .order_by("-created_at")
            .values_list("keyword", flat=True)[:5]
        )

        recent_viewed = ViewedPolicy.objects.filter(user=user).order_by("-viewed_at")[:5]
        recent_viewed_policies = [
            {
                "item_id": v.policy.item_id,
                "title": v.policy.title,
                "viewed_at": v.viewed_at,
            }
            for v in recent_viewed
        ]

        unread_notification_count = Notification.objects.filter(
            user=user, is_read=False
        ).count()

        data = {
            "profile": UserProfileSerializer(profile).data if profile else {},
            "scrap_count": scrap_count,
            "recent_searches": recent_searches,
            "recent_viewed_policies": recent_viewed_policies,
            "unread_notification_count": unread_notification_count,
        }

        serializer = MypageSummarySerializer(data)
        return success_response(data=serializer.data, message="마이페이지 요약을 조회했습니다.")