from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_serializers import (
    PasswordResetEmailSendSerializer,
    PasswordResetSerializer,
    SignupEmailConfirmSerializer,
    SignupEmailSendSerializer,
    SignupSerializer,
)
from .email_verification_utils import issue_verification_code
from .models import EmailVerificationCode


class SignupEmailSendView(APIView):
    """POST /api/auth/signup/email/send/"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupEmailSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_verification_code(
            serializer.validated_data["email"], EmailVerificationCode.Purpose.SIGNUP
        )
        return Response({"detail": "인증번호가 발송되었습니다."}, status=status.HTTP_200_OK)


class SignupEmailConfirmView(APIView):
    """POST /api/auth/signup/email/confirm/"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupEmailConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"detail": "인증되었습니다."}, status=status.HTTP_200_OK)


class SignupView(APIView):
    """POST /api/auth/signup/"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"id": user.id, "email": user.email, "username": user.username},
            status=status.HTTP_201_CREATED,
        )


class PasswordResetEmailSendView(APIView):
    """POST /api/auth/password-reset/email/send/"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetEmailSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_verification_code(
            serializer.validated_data["email"],
            EmailVerificationCode.Purpose.PASSWORD_RESET,
        )
        return Response({"detail": "인증번호가 발송되었습니다."}, status=status.HTTP_200_OK)


class PasswordResetView(APIView):
    """POST /api/auth/password-reset/"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "비밀번호가 변경되었습니다."}, status=status.HTTP_200_OK)