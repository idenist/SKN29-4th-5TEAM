from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Comment, CommunityPost
from .permissions import IsAuthorOrReadOnly
from .serializers import (
    CommentSerializer,
    CommunityPostDetailSerializer,
    CommunityPostListSerializer,
    CommunityPostWriteSerializer,
)


class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.select_related("author").prefetch_related(
        "comments__author"
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    lookup_url_kwarg = "post_id"

    def get_serializer_class(self):
        if self.action == "list":
            return CommunityPostListSerializer
        if self.action == "retrieve":
            return CommunityPostDetailSerializer
        return CommunityPostWriteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        user = self.request.user
        if instance.author_id != user.id and not user.is_staff:
            raise PermissionDenied("작성자만 수정할 수 있습니다.")
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        session_key = f"community_post_viewed:{instance.pk}"
        if not request.session.get(session_key):
            instance.view_count += 1
            instance.save(update_fields=["view_count"])
            request.session[session_key] = True
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    /api/community/posts/{post_id}/comments/
    urls.py에서 post_id를 kwarg로 받도록 nested route로 연결해주세요.
    """

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    http_method_names = ["get", "post", "delete"]  # 댓글 수정은 범위 밖, 필요 시 put/patch 추가

    def get_queryset(self):
        return Comment.objects.filter(
            post_id=self.kwargs["post_id"]
        ).select_related("author")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, post_id=self.kwargs["post_id"])
