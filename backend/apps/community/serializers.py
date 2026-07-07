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
<<<<<<< HEAD
    author_email = serializers.CharField(source="author.email", read_only=True)
    author_name = serializers.SerializerMethodField()
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    content_preview = serializers.SerializerMethodField()
=======
    """게시글 목록용 - author_email 대신 author_name 노출"""

    author_name = serializers.CharField(read_only=True)
    category_label = serializers.CharField(
        source="get_category_display", read_only=True
    )
    comment_count = serializers.SerializerMethodField()
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "category",
            "category_label",
            "title",
<<<<<<< HEAD
            "content_preview",
            "author_email",
            "author_name",
=======
            "author_name",
            "category",
            "category_label",
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a
            "view_count",
            "comment_count",
            "created_at",
            "updated_at",
        ]

<<<<<<< HEAD
    def get_author_name(self, obj):
        return obj.author.username or obj.author.email

    def get_content_preview(self, obj):
        return obj.content[:100]


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source="author.email", read_only=True)
    author_name = serializers.SerializerMethodField()
    category_label = serializers.CharField(source="get_category_display", read_only=True)
=======
    def get_comment_count(self, obj):
        return obj.comments.count()


class CommunityPostDetailSerializer(serializers.ModelSerializer):
    """게시글 상세용 - author_email 대신 author_name 노출"""

    author_name = serializers.CharField(read_only=True)
    category_label = serializers.CharField(
        source="get_category_display", read_only=True
    )
    comments = CommentSerializer(many=True, read_only=True)
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a

    class Meta:
        model = CommunityPost
        fields = [
            "id",
            "category",
            "category_label",
            "title",
            "content",
<<<<<<< HEAD
            "author",
            "author_email",
            "author_name",
=======
            "author_name",
            "category",
            "category_label",
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a
            "view_count",
            "comments",
            "created_at",
            "updated_at",
        ]
<<<<<<< HEAD
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
=======


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
>>>>>>> 50c67f79ae02d80099f0dcb29ad86131bb44f18a
