from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .email_verification_utils import issue_verification_code
from .models import EmailVerificationCode, UserProfile
from .serializers import (
    LoginSerializer,
    MeSerializer,
    PasswordChangeSerializer,
    PasswordResetEmailSendSerializer,
    PasswordResetSerializer,
    SignupEmailConfirmSerializer,
    SignupEmailSendSerializer,
    SignupSerializer,
    UserProfileSerializer,
)

User = get_user_model()


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


def first_error(serializer):
    first_field = next(iter(serializer.errors))
    value = serializer.errors[first_field]
    if isinstance(value, list) and value:
        first_reason = str(value[0])
    elif isinstance(value, dict):
        nested_field = next(iter(value))
        nested_value = value[nested_field]
        first_reason = str(nested_value[0] if isinstance(nested_value, list) and nested_value else nested_value)
    else:
        first_reason = str(value)
    return first_field, first_reason


def normalize_email(email):
    return (email or "").strip().lower()


def login_failure_cache_key(email):
    return f"auth:login_failures:{normalize_email(email)}"


def get_login_failure_limit():
    return getattr(settings, "LOGIN_FAILURE_LIMIT", 5)


def get_login_failure_timeout():
    return getattr(settings, "LOGIN_FAILURE_WINDOW_MINUTES", 30) * 60


def get_login_failure_count(email):
    if not email:
        return 0
    return int(cache.get(login_failure_cache_key(email), 0) or 0)


def record_login_failure(email):
    if not email:
        return 0
    count = get_login_failure_count(email) + 1
    cache.set(login_failure_cache_key(email), count, get_login_failure_timeout())
    return count


def clear_login_failures(email):
    if email:
        cache.delete(login_failure_cache_key(email))


def is_password_reset_required(email):
    return get_login_failure_count(email) >= get_login_failure_limit()


def password_reset_required_response(email):
    return error_response(
        message="비밀번호를 여러 번 잘못 입력했습니다. 이메일 인증 후 비밀번호를 재설정해 주세요.",
        error={
            "code": "PASSWORD_RESET_REQUIRED",
            "field": "password",
            "failed_attempts": get_login_failure_count(email),
            "limit": get_login_failure_limit(),
        },
        status_code=status.HTTP_423_LOCKED,
    )


class SignupEmailSendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupEmailSendSerializer(data=request.data)
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("이메일을 확인해 주세요.", {"field": field, "reason": reason})

        issue_verification_code(serializer.validated_data["email"], EmailVerificationCode.Purpose.SIGNUP)
        return success_response(message="인증번호를 이메일로 보냈습니다.")


class SignupEmailConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupEmailConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("인증번호를 확인해 주세요.", {"field": field, "reason": reason})

        return success_response(message="이메일 인증이 완료되었습니다.")


class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("입력값이 올바르지 않습니다.", {"field": field, "reason": reason})

        user = serializer.save()
        return success_response(
            data={"id": user.id, "email": user.email, "username": user.username},
            message="회원가입이 완료되었습니다.",
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = normalize_email(request.data.get("email"))

        if is_password_reset_required(email):
            return password_reset_required_response(email)

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            if email and User.objects.filter(email=email).exists():
                failed_attempts = record_login_failure(email)
                if failed_attempts >= get_login_failure_limit():
                    return password_reset_required_response(email)

            return error_response(
                message="이메일 또는 비밀번호가 올바르지 않습니다.",
                error={
                    "code": "INVALID_CREDENTIALS",
                    "field": "password",
                    "failed_attempts": get_login_failure_count(email),
                    "limit": get_login_failure_limit(),
                },
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.validated_data["user"]
        clear_login_failures(user.email)
        tokens = serializer.get_tokens(user)
        return success_response(data=tokens, message="로그인되었습니다.")


class PasswordResetEmailSendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetEmailSendSerializer(data=request.data)
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("이메일을 확인해 주세요.", {"field": field, "reason": reason})

        issue_verification_code(
            serializer.validated_data["email"],
            EmailVerificationCode.Purpose.PASSWORD_RESET,
        )
        return success_response(message="비밀번호 재설정 인증번호를 이메일로 보냈습니다.")


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("입력값이 올바르지 않습니다.", {"field": field, "reason": reason})

        serializer.save()
        clear_login_failures(serializer.validated_data["email"])
        return success_response(message="비밀번호가 변경되었습니다.")


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("입력값이 올바르지 않습니다.", {"field": field, "reason": reason})

        serializer.save()
        clear_login_failures(request.user.email)
        return success_response(message="비밀번호가 변경되었습니다. 다시 로그인해 주세요.")


class MeView(generics.RetrieveAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(data=serializer.data)


class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if not serializer.is_valid():
            field, reason = first_error(serializer)
            return error_response("입력값이 올바르지 않습니다.", {"field": field, "reason": reason})

        serializer.save()
        return success_response(data=serializer.data, message="프로필이 수정되었습니다.")