# 저장 위치: backend/apps/notifications/views.py  (덮어쓰기)
# 변경점: success_response/error_response 로컬 정의 제거 -> apps.common.responses에서 import
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.common.responses import success_response, error_response

from .models import Notification
from .serializers import NotificationSerializer


# ---------------------------------------------------------
# 내 알림 목록 조회
# ---------------------------------------------------------
class NotificationListView(ListAPIView):
    """
    GET /api/notifications/
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        unread_count = queryset.filter(is_read=False).count()
        return success_response(
            data={
                "notifications": serializer.data,
                "unread_count": unread_count,
            },
            message="알림 목록을 조회했습니다.",
        )


# ---------------------------------------------------------
# 안 읽은 알림 개수만 조회 (Header 드롭다운 배지용)
# ---------------------------------------------------------
class NotificationUnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return success_response(data={"unread_count": unread_count})


# ---------------------------------------------------------
# 알림 전체 읽음 처리
# ---------------------------------------------------------
class NotificationReadAllView(APIView):
    """
    PATCH /api/notifications/read-all/
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        updated_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return success_response(
            data={"updated_count": updated_count},
            message="모든 알림을 읽음 처리했습니다.",
        )


# ---------------------------------------------------------
# 알림 읽음 처리
# ---------------------------------------------------------
class NotificationReadView(APIView):
    """
    PATCH /api/notifications/{id}/read/
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, user=request.user
            )
        except Notification.DoesNotExist:
            return error_response(
                message="알림을 찾을 수 없습니다.",
                error="NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return success_response(
            data=NotificationSerializer(notification).data,
            message="알림을 읽음 처리했습니다.",
        )


# ---------------------------------------------------------
# 알림 삭제
# ---------------------------------------------------------
class NotificationDeleteView(APIView):
    """
    DELETE /api/notifications/{id}/
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, user=request.user
            )
        except Notification.DoesNotExist:
            return error_response(
                message="알림을 찾을 수 없습니다.",
                error="NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        notification.delete()
        return success_response(message="알림을 삭제했습니다.")