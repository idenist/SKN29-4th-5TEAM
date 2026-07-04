from rest_framework import serializers

from .models import CommunityPost


class CommunityPostListSerializer(serializers.ModelSerializer):
    """게시글 목록용 - content는 미리보기만 잘라서 보여준다."""

    author_email = serializers.CharField(source="author.email", read_only=True)
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "title",
            "content_preview",
            "author_email",
            "view_count",
            "created_at",
        ]
        read_only_fields = fields

    def get_content_preview(self, obj):
        return obj.content[:100]


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    """게시글 상세 조회/작성/수정용."""

    author_email = serializers.CharField(source="author.email", read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "title",
            "content",
            "author",
            "author_email",
            "view_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "author_email", "view_count", "created_at", "updated_at"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("제목을 입력해주세요.")
        return value

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("내용을 입력해주세요.")
        return value

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)