from rest_framework import serializers

from .models import Comment, CommunityPost


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author_name = serializers.CharField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author_id",
            "author_name",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "post", "author_id", "author_name", "created_at", "updated_at"]


class CommunityPostListSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author_name = serializers.CharField(read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    comment_count = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "category",
            "category_label",
            "title",
            "content_preview",
            "author_id",
            "author_name",
            "view_count",
            "comment_count",
            "created_at",
            "updated_at",
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_content_preview(self, obj):
        return obj.content[:100]


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author_name = serializers.CharField(read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "category",
            "category_label",
            "title",
            "content",
            "author_id",
            "author_name",
            "view_count",
            "comments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author_id",
            "author_name",
            "category_label",
            "view_count",
            "comments",
            "created_at",
            "updated_at",
        ]


class CommunityPostWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ["title", "content", "category"]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("제목을 입력해 주세요.")
        return value

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("내용을 입력해 주세요.")
        return value

    def validate_category(self, value):
        valid_values = [choice for choice, _ in CommunityPost.Category.choices]
        if value not in valid_values:
            raise serializers.ValidationError(f"category는 {valid_values} 중 하나여야 합니다.")
        return value
