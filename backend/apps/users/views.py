from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailVerificationCode, UserProfile
from .email_verification_utils import issue_verification_code
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    MeSerializer,
    UserProfileSerializer,
    SignupEmailSendSerializer,
    SignupEmailConfirmSerializer,
    PasswordResetEmailSendSerializer,
    PasswordResetSerializer,
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


def _first_error(serializer):
    first_field = next(iter(serializer.errors))
    first_reason = str(serializer.errors[first_field][0])
    return first_field, first_reason


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
            first_field, first_reason = _first_error(serializer)
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
# 회원가입 이메일 인증
# ---------------------------------------------------------
class SignupEmailSendView(APIView):
    """
    POST /api/auth/signup/email/send/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupEmailSendSerializer(data=request.data)
        if not serializer.is_valid():
            first_field, first_reason = _first_error(serializer)
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        issue_verification_code(
            serializer.validated_data["email"], EmailVerificationCode.Purpose.SIGNUP
        )
        return success_response(message="인증번호가 발송되었습니다.")


class SignupEmailConfirmView(APIView):
    """
    POST /api/auth/signup/email/confirm/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupEmailConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            first_field, first_reason = _first_error(serializer)
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        return success_response(message="인증되었습니다.")


# ---------------------------------------------------------
# 비밀번호 찾기
# ---------------------------------------------------------
class PasswordResetEmailSendView(APIView):
    """
    POST /api/auth/password-reset/email/send/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetEmailSendSerializer(data=request.data)
        if not serializer.is_valid():
            first_field, first_reason = _first_error(serializer)
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        issue_verification_code(
            serializer.validated_data["email"],
            EmailVerificationCode.Purpose.PASSWORD_RESET,
        )
        return success_response(message="인증번호가 발송되었습니다.")


class PasswordResetView(APIView):
    """
    POST /api/auth/password-reset/
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            first_field, first_reason = _first_error(serializer)
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        serializer.save()
        return success_response(message="비밀번호가 변경되었습니다.")


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
            first_field, first_reason = _first_error(serializer)
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )
        serializer.save()
        return success_response(data=serializer.data, message="프로필이 수정되었습니다.")