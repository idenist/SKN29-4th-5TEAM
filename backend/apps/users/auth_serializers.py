from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .email_verification_utils import consume_verified_code, verify_code
from .models import EmailVerificationCode

User = get_user_model()


# ---------- 회원가입 이메일 인증 ----------


class SignupEmailSendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return value


class SignupEmailConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        verification = verify_code(
            attrs["email"], attrs["code"], EmailVerificationCode.Purpose.SIGNUP
        )
        if verification is None:
            raise serializers.ValidationError("인증번호가 올바르지 않거나 만료되었습니다.")
        return attrs


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    verification_code = serializers.CharField(write_only=True, max_length=6, min_length=6)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password_confirm",
            "verification_code",
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "비밀번호가 일치하지 않습니다."})
        validate_password(attrs["password"])

        ok = consume_verified_code(
            attrs["email"],
            attrs["verification_code"],
            EmailVerificationCode.Purpose.SIGNUP,
        )
        if not ok:
            raise serializers.ValidationError(
                {"verification_code": "이메일 인증이 완료되지 않았거나 인증번호가 만료되었습니다."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        validated_data.pop("verification_code")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ---------- 비밀번호 찾기 ----------


class PasswordResetEmailSendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("가입되지 않은 이메일입니다.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("가입되지 않은 이메일입니다.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "비밀번호가 일치하지 않습니다."}
            )
        validate_password(attrs["new_password"])
        return attrs

    def save(self, **kwargs):
        email = self.validated_data["email"]
        code = self.validated_data["code"]

        # 비밀번호 찾기는 별도 confirm 단계 없이 여기서 바로 코드 검증 + 소모 처리
        verification = EmailVerificationCode.objects.filter(
            email=email,
            code=code,
            purpose=EmailVerificationCode.Purpose.PASSWORD_RESET,
            is_used=False,
        ).order_by("-created_at").first()

        if verification is None or verification.is_expired():
            raise serializers.ValidationError(
                {"code": "인증번호가 올바르지 않거나 만료되었습니다."}
            )

        verification.is_used = True
        verification.is_verified = True
        verification.save(update_fields=["is_used", "is_verified"])

        user = User.objects.get(email=email)
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user