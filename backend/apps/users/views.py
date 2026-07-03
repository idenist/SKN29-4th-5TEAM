from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    MeSerializer,
    UserProfileSerializer,
)


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
# 회원가입
# ---------------------------------------------------------
class SignupView(generics.CreateAPIView):
    """
    POST /api/auth/signup/
    """

    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        user = serializer.save()
        return success_response(
            data={"id": user.id, "email": user.email},
            message="회원가입이 완료되었습니다.",
            status_code=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------
# 로그인
# ---------------------------------------------------------
class LoginView(APIView):
    """
    POST /api/auth/login/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="이메일 또는 비밀번호가 올바르지 않습니다.",
                error="INVALID_CREDENTIALS",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        user = serializer.validated_data["user"]
        tokens = serializer.get_tokens(user)
        return success_response(data=tokens, message="로그인되었습니다.")


# ---------------------------------------------------------
# 내 정보 조회
# ---------------------------------------------------------
class MeView(generics.RetrieveAPIView):
    """
    GET /api/auth/me/
    """

    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


# ---------------------------------------------------------
# 프로필 수정
# ---------------------------------------------------------
class ProfileUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/auth/profile/
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        serializer.save()
        return success_response(data=serializer.data, message="프로필이 수정되었습니다.")