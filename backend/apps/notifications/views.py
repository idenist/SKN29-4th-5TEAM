# apps/notifications/views.py

from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


def success_response(data=None, message="", status_code=status.HTTP_200_OK):
    return Response(
        {"success": True, "data": data, "message": message, "error": None},
        status=status_code,
    )


def error_response(message="", error=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "data": None, "message": message, "error": error},
        status=status_code,
    )


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