from django.conf import settings
from rest_framework import serializers


class ProfileImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, value):
        ext = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if ext not in settings.PROFILE_IMAGE_ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"허용되지 않는 파일 형식입니다. ({', '.join(settings.PROFILE_IMAGE_ALLOWED_EXTENSIONS)}만 가능)"
            )

        max_bytes = settings.PROFILE_IMAGE_MAX_SIZE_MB * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f"파일 크기는 {settings.PROFILE_IMAGE_MAX_SIZE_MB}MB 이하여야 합니다."
            )

        return value