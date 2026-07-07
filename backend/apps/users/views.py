import random

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailVerificationCode, UserProfile
from .serializers import (
    EmailVerificationConfirmSerializer,
    EmailVerificationSendSerializer,
    LoginSerializer,
    MeSerializer,
    PasswordChangeSerializer,
    PasswordResetSerializer,
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


def create_verification_code(email, purpose):
    code = f"{random.randint(0, 999999):06d}"
    expires_at = timezone.now() + timezone.timedelta(
        minutes=getattr(settings, "EMAIL_VERIFICATION_EXPIRE_MINUTES", 10)
    )
    return EmailVerificationCode.objects.create(
        email=email,
        code=code,
        purpose=purpose,
        expires_at=expires_at,
    )


def send_verification_email(email, code, purpose):
    subject_map = {
        EmailVerificationCode.PURPOSE_SIGNUP: "[이젠, 안쉼] 회원가입 인증번호",
        EmailVerificationCode.PURPOSE_PASSWORD_RESET: "[이젠, 안쉼] 비밀번호 재설정 인증번호",
    }
    subject = subject_map[purpose]
    message = (
        f"인증번호는 {code} 입니다.\n"
        f"{getattr(settings, 'EMAIL_VERIFICATION_EXPIRE_MINUTES', 10)}분 안에 입력해 주세요."
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        recipient_list=[email],
        fail_silently=False,
    )


class SignupView(generics.CreateAPIView):
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
            data={"id": user.id, "email": user.email, "username": user.username},
            message="회원가입이 완료되었습니다.",
            status_code=status.HTTP_201_CREATED,
        )


class SignupEmailSendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSendSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="이메일을 확인해 주세요.", error=serializer.errors)

        email = serializer.validated_data["email"]
        if User.objects.filter(email=email).exists():
            return error_response(
                message="이미 사용 중인 이메일입니다.",
                error={"field": "email", "reason": "이미 사용 중인 이메일입니다."},
            )

        verification = create_verification_code(email, EmailVerificationCode.PURPOSE_SIGNUP)
        send_verification_email(email, verification.code, EmailVerificationCode.PURPOSE_SIGNUP)
        return success_response(message="인증번호를 이메일로 보냈습니다.")


class SignupEmailConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="인증번호를 확인해 주세요.", error=serializer.errors)

        email = serializer.validated_data["email"]
        code = serializer.validated_data["code"]
        verification = (
            EmailVerificationCode.objects.filter(
                email=email,
                code=code,
                purpose=EmailVerificationCode.PURPOSE_SIGNUP,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )
        if verification is None or verification.is_expired():
            return error_response(
                message="인증번호가 올바르지 않거나 만료되었습니다.",
                error={"field": "verification_code", "reason": "인증번호가 올바르지 않거나 만료되었습니다."},
            )

        verification.mark_verified()
        return success_response(message="이메일 인증이 완료되었습니다.")


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
        serializer = EmailVerificationSendSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="이메일을 확인해 주세요.", error=serializer.errors)

        email = serializer.validated_data["email"]
        if not User.objects.filter(email=email).exists():
            return error_response(
                message="가입된 이메일을 찾을 수 없습니다.",
                error={"field": "email", "reason": "가입된 이메일을 찾을 수 없습니다."},
            )

        verification = create_verification_code(email, EmailVerificationCode.PURPOSE_PASSWORD_RESET)
        send_verification_email(email, verification.code, EmailVerificationCode.PURPOSE_PASSWORD_RESET)
        return success_response(message="비밀번호 재설정 인증번호를 이메일로 보냈습니다.")


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )

        serializer.save()
        clear_login_failures(serializer.validated_data["email"])
        return success_response(message="비밀번호가 변경되었습니다.")


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )

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
            first_field = next(iter(serializer.errors))
            first_reason = str(serializer.errors[first_field][0])
            return error_response(
                message="입력값이 올바르지 않습니다.",
                error={"field": first_field, "reason": first_reason},
            )

        serializer.save()
        return success_response(data=serializer.data, message="프로필이 수정되었습니다.")
