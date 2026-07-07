from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .email_verification_utils import consume_verified_code, verify_code
from .models import EmailVerificationCode, UserProfile

User = get_user_model()


class SignupEmailSendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return email


class SignupEmailConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        verification = verify_code(
            attrs["email"].strip().lower(),
            attrs["code"],
            EmailVerificationCode.Purpose.SIGNUP,
        )
        if verification is None:
            raise serializers.ValidationError({"code": "인증번호가 올바르지 않거나 만료되었습니다."})
        return attrs


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    verification_code = serializers.CharField(write_only=True, min_length=6, max_length=6)

    class Meta:
        model = User
        fields = ["email", "username", "password", "password_confirm", "verification_code"]

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return email

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
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        user = authenticate(email=email, password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("이메일 또는 비밀번호가 올바르지 않습니다.")
        if not user.is_active:
            raise serializers.ValidationError("비활성화된 계정입니다.")
        attrs["user"] = user
        return attrs

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class PasswordResetEmailSendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        email = value.strip().lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("가입된 이메일을 찾을 수 없습니다.")
        return email


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.strip().lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("가입된 이메일을 찾을 수 없습니다.")
        return email

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "비밀번호가 일치하지 않습니다."})

        validate_password(attrs["new_password"])

        verification = EmailVerificationCode.objects.filter(
            email=attrs["email"],
            code=attrs["code"],
            purpose=EmailVerificationCode.Purpose.PASSWORD_RESET,
            is_used=False,
        ).order_by("-created_at").first()

        if verification is None or verification.is_expired():
            raise serializers.ValidationError({"code": "인증번호가 올바르지 않거나 만료되었습니다."})

        attrs["verification"] = verification
        return attrs

    def save(self, **kwargs):
        user = User.objects.get(email=self.validated_data["email"])
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])

        verification = self.validated_data["verification"]
        verification.mark_verified()
        verification.mark_used()
        return user


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("현재 비밀번호가 올바르지 않습니다.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "비밀번호가 일치하지 않습니다."})

        validate_password(attrs["new_password"], self.context["request"].user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["age", "region", "interests", "profile_image_url", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_age(self, value):
        if value is not None and not (0 < value < 120):
            raise serializers.ValidationError("나이는 1~119 사이여야 합니다.")
        return value

    def validate_region(self, value):
        if value is not None and value.strip() == "":
            raise serializers.ValidationError("거주지를 입력해 주세요.")
        return value

    def validate_interests(self, value):
        return value


class MeSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "profile", "date_joined"]


EmailVerificationSendSerializer = SignupEmailSendSerializer
EmailVerificationConfirmSerializer = SignupEmailConfirmSerializer