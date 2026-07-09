from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification

from .models import Comment, CommunityPost, Like
from .permissions import IsAuthorOrReadOnly
from .serializers import (
    CommentSerializer,
    CommunityPostDetailSerializer,
    CommunityPostListSerializer,
    CommunityPostWriteSerializer,
)


def create_post_activity_notification(post, actor, title, message):
    if post.author_id == actor.id:
        return

    Notification.objects.create(
        user=post.author,
        notification_type=Notification.NotificationType.SYSTEM,
        title=title,
        message=message,
        link=f"/community/{post.id}",
    )


class CommunityPostViewSet(viewsets.ModelViewSet):
    queryset = CommunityPost.objects.select_related("author").prefetch_related(
        "comments__author", "likes"
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
    http_method_names = ["get", "post", "patch", "delete"]  # patch 추가로 댓글 수정 허용

    def get_queryset(self):
        return Comment.objects.filter(
            post_id=self.kwargs["post_id"]
        ).select_related("author")

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user, post_id=self.kwargs["post_id"])
        create_post_activity_notification(
            comment.post,
            self.request.user,
            "게시글에 새 댓글이 달렸습니다",
            f"{self.request.user}님이 회원님의 글에 댓글을 남겼습니다.",
        )


class PostLikeToggleView(APIView):
    """
    POST /api/community/posts/{post_id}/like/
    로그인 사용자가 이미 좋아요를 눌렀으면 취소, 아니면 좋아요 추가 (토글).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(CommunityPost, pk=post_id)
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
            create_post_activity_notification(
                post,
                request.user,
                "게시글에 좋아요가 눌렸습니다",
                f"{request.user}님이 회원님의 글을 좋아합니다.",
            )
        return Response(
            {"post_id": post.id, "is_liked": liked, "likes": post.likes.count(), "like_count": post.likes.count()},
            status=status.HTTP_200_OK,
        )
