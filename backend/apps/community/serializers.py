from rest_framework import serializers

from .models import Comment, CommunityPost


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author_name",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "post", "author_name", "created_at", "updated_at"]


class CommunityPostListSerializer(serializers.ModelSerializer):
    """게시글 목록용 - author_email 대신 author_name 노출"""

    author_name = serializers.CharField(read_only=True)
    category_label = serializers.CharField(
        source="get_category_display", read_only=True
    )
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "title",
            "author_name",
            "category",
            "category_label",
            "view_count",
            "comment_count",
            "created_at",
            "updated_at",
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    """게시글 상세용 - author_email 대신 author_name 노출"""

    author_name = serializers.CharField(read_only=True)
    category_label = serializers.CharField(
        source="get_category_display", read_only=True
    )
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "title",
            "content",
            "author_name",
            "category",
            "category_label",
            "view_count",
            "comments",
            "created_at",
            "updated_at",
        ]


class CommunityPostWriteSerializer(serializers.ModelSerializer):
    """게시글 생성/수정용 - category를 입력받음"""

    class Meta:
        model = CommunityPost
        fields = ["title", "content", "category"]

    def validate_category(self, value):
        valid_values = [choice for choice, _ in CommunityPost.Category.choices]
        if value not in valid_values:
            raise serializers.ValidationError(
                f"category는 {valid_values} 중 하나여야 합니다."
            )
        return value