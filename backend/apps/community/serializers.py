from rest_framework import serializers

from .models import CommunityPost


class CommunityPostListSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source="author.email", read_only=True)
    author_name = serializers.SerializerMethodField()
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "category",
            "category_label",
            "title",
            "content_preview",
            "author_email",
            "author_name",
            "view_count",
            "created_at",
        ]
        read_only_fields = fields

    def get_author_name(self, obj):
        return obj.author.username or obj.author.email

    def get_content_preview(self, obj):
        return obj.content[:100]


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source="author.email", read_only=True)
    author_name = serializers.SerializerMethodField()
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "category",
            "category_label",
            "title",
            "content",
            "author",
            "author_email",
            "author_name",
            "view_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "author_email",
            "author_name",
            "category_label",
            "view_count",
            "created_at",
            "updated_at",
        ]

    def get_author_name(self, obj):
        return obj.author.username or obj.author.email

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("제목을 입력해 주세요.")
        return value

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("내용을 입력해 주세요.")
        return value

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
