from botocore.exceptions import BotoCoreError, ClientError
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProfileImageUploadSerializer
from .services import upload_profile_image, delete_profile_image


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


class ProfileImageUploadView(APIView):
    """
    POST   /api/uploads/profile-image/   - 프로필 이미지 업로드
    DELETE /api/uploads/profile-image/   - 프로필 이미지 삭제(기본 이미지로 변경)
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ProfileImageUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        profile = request.user.profile
        image_file = serializer.validated_data["image"]

        try:
            # 기존 이미지가 있으면 먼저 삭제 (실패해도 무시하고 계속 진행)
            delete_profile_image(profile.profile_image_url)
            new_url = upload_profile_image(request.user, image_file)
        except (BotoCoreError, ClientError) as e:
            return error_response(
                message="이미지 업로드 중 오류가 발생했습니다.",
                error=str(e),
                status_code=status.HTTP_502_BAD_GATEWAY,
            )

        profile.profile_image_url = new_url
        profile.save(update_fields=["profile_image_url", "updated_at"])

        return success_response(
            data={"profile_image_url": new_url},
            message="프로필 이미지가 업로드되었습니다.",
            status_code=status.HTTP_201_CREATED,
        )

    def delete(self, request):
        profile = request.user.profile

        try:
            delete_profile_image(profile.profile_image_url)
        except (BotoCoreError, ClientError) as e:
            return error_response(
                message="이미지 삭제 중 오류가 발생했습니다.",
                error=str(e),
                status_code=status.HTTP_502_BAD_GATEWAY,
            )

        profile.profile_image_url = None
        profile.save(update_fields=["profile_image_url", "updated_at"])

        return success_response(message="프로필 이미지가 삭제되었습니다.")