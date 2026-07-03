from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Policy, Scrap, SearchHistory, ViewedPolicy
from .serializers import (
    PolicyListSerializer,
    PolicyDetailSerializer,
    ScrapSerializer,
    SearchHistorySerializer,
    ViewedPolicySerializer,
)


def success_response(data=None, message="", status_code=status.HTTP_200_OK):
    """공통 응답 형식 (지침서 4.1 공통 API 응답 통일 기준)"""
    return Response(
        {"success": True, "data": data, "message": message, "error": None},
        status=status_code,
    )


def error_response(message="", error=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "data": None, "message": message, "error": error},
        status=status_code,
    )


# ---------------------------------------------------------
# 정책 목록 / 검색
# ---------------------------------------------------------
class PolicyListView(generics.ListAPIView):
    """
    GET /api/policies/
    쿼리 파라미터: keyword, region, source_category
    """

    serializer_class = PolicyListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Policy.objects.all().order_by("-info_score")
        keyword = self.request.query_params.get("keyword")
        region = self.request.query_params.get("region")
        source_category = self.request.query_params.get("source_category")

        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) | Q(policy_summary__icontains=keyword)
            )
        if region:
            queryset = queryset.filter(region_codes__contains=[region])
        if source_category:
            queryset = queryset.filter(source_category=source_category)

        if keyword and self.request.user.is_authenticated:
            SearchHistory.objects.create(user=self.request.user, keyword=keyword)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


# ---------------------------------------------------------
# 정책 상세 조회
# ---------------------------------------------------------
class PolicyDetailView(generics.RetrieveAPIView):
    """
    GET /api/policies/{item_id}/
    """

    queryset = Policy.objects.all()
    serializer_class = PolicyDetailSerializer
    lookup_field = "item_id"
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        if request.user.is_authenticated:
            ViewedPolicy.objects.update_or_create(
                user=request.user, policy=instance
            )

        return success_response(data=serializer.data)


# ---------------------------------------------------------
# 스크랩
# ---------------------------------------------------------
class ScrapListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/policies/scraps/   - 내 스크랩 목록
    POST /api/policies/scraps/   - 스크랩 추가
    """

    serializer_class = ScrapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Scrap.objects.filter(user=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            data=serializer.data, message="스크랩되었습니다.", status_code=status.HTTP_201_CREATED
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


class ScrapDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/policies/scraps/{item_id}/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        item_id = self.kwargs["item_id"]
        try:
            return Scrap.objects.get(user=self.request.user, policy__item_id=item_id)
        except Scrap.DoesNotExist:
            return None

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return error_response(
                message="스크랩 내역이 없습니다.", status_code=status.HTTP_404_NOT_FOUND
            )
        instance.delete()
        return success_response(message="스크랩이 삭제되었습니다.")


# ---------------------------------------------------------
# 검색 기록
# ---------------------------------------------------------
class SearchHistoryListView(generics.ListAPIView):
    """
    GET /api/policies/search-history/
    """

    serializer_class = SearchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user).order_by("-created_at")[:20]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


# ---------------------------------------------------------
# 최근 본 공고
# ---------------------------------------------------------
class ViewedPolicyListView(generics.ListAPIView):
    """
    GET /api/policies/viewed/
    """

    serializer_class = ViewedPolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ViewedPolicy.objects.filter(user=self.request.user).order_by("-viewed_at")[:20]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)