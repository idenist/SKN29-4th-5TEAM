from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile

User = get_user_model()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "username", "password", "password_confirm"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "비밀번호가 일치하지 않습니다."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
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
        user = authenticate(email=attrs["email"], password=attrs["password"])
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
            raise serializers.ValidationError("거주지는 빈 값일 수 없습니다.")
        return value

    def validate_interests(self, value):
        # TODO: 허용 카테고리 확정 후 검증 로직 추가
        # 3차 온통청년 대분류: 일자리/주거/교육/복지문화/참여권리
        # 4차 UserProfile.interests에 동일 적용 여부 미확인 (정승 확인 대기)
        return value


class MeSerializer(serializers.ModelSerializer):
    """내 정보 조회용 - User + Profile 합쳐서 반환"""

    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "profile", "date_joined"]