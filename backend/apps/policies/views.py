# 저장 위치: backend/apps/policies/views.py  (덮어쓰기)
# 변경점: success_response/error_response 로컬 정의 제거 -> apps.common.responses에서 import
import re

from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone
from rest_framework import generics, permissions, status

from apps.common.responses import success_response, error_response

from .constants import resolve_region_code
from .models import Policy, Scrap, SearchHistory, ViewedPolicy, PopularSearchKeyword
from .serializers import (
    PolicyListSerializer,
    PolicyDetailSerializer,
    ScrapSerializer,
    SearchHistorySerializer,
    ViewedPolicySerializer,
    PopularSearchKeywordSerializer,
)


# ---------------------------------------------------------
# 정책 목록 / 검색
# ---------------------------------------------------------

# ---------------------------------------------------------
# 인기 검색어 익명 집계 유틸
# ---------------------------------------------------------
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^(?:\+?82[-.\s]?)?0?1[016789][-.\s]?\d{3,4}[-.\s]?\d{4}$")
RRN_PATTERN = re.compile(r"^\d{6}[-\s]?[1-4]\d{6}$")
LONG_NUMBER_PATTERN = re.compile(r"^\d{6,}$")


def normalize_popular_search_keyword(raw_keyword):
    if raw_keyword is None:
        return ""

    keyword = " ".join(str(raw_keyword).strip().split())

    if len(keyword) < 2:
        return ""
    if len(keyword) > 50:
        return ""

    compact = keyword.replace("-", "").replace(" ", "").replace(".", "")

    if EMAIL_PATTERN.match(keyword):
        return ""
    if PHONE_PATTERN.match(keyword):
        return ""
    if RRN_PATTERN.match(keyword):
        return ""
    if LONG_NUMBER_PATTERN.match(compact):
        return ""

    return keyword.lower()


def record_popular_search_keyword(raw_keyword):
    keyword = normalize_popular_search_keyword(raw_keyword)
    if not keyword:
        return

    now = timezone.now()

    with transaction.atomic():
        obj, _ = PopularSearchKeyword.objects.select_for_update().get_or_create(
            keyword=keyword,
            defaults={"count": 0, "last_searched_at": now},
        )
        obj.count = F("count") + 1
        obj.last_searched_at = now
        obj.save(update_fields=["count", "last_searched_at", "updated_at"])


class PolicyListView(generics.ListAPIView):
    """
    GET /api/policies/
    쿼리 파라미터: keyword, region, source_category, domain, age, income_condition, deadline_status, limit, offset
    """

    serializer_class = PolicyListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Policy.objects.all().order_by("-info_score")
        keyword = (
            self.request.query_params.get("keyword")
            or self.request.query_params.get("search")
            or self.request.query_params.get("q")
        )
        region = self.request.query_params.get("region")
        source_category = self.request.query_params.get("source_category")
        domain = self.request.query_params.get("domain")
        age = self.request.query_params.get("age")
        income_condition = self.request.query_params.get("income_condition")
        deadline_status = self.request.query_params.get("deadline_status")

        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) | Q(policy_summary__icontains=keyword)
            )
        if region:
            region_code = resolve_region_code(region)
            queryset = queryset.filter(region_codes__contains=[region_code])
        if source_category:
            queryset = queryset.filter(source_category=source_category)
        if domain:
            queryset = queryset.filter(domain__icontains=domain)

        if age:
            age = int(age)
            queryset = queryset.filter(
                Q(age_min__isnull=True) | Q(age_min__lte=age),
            ).filter(
                Q(age_max__isnull=True) | Q(age_max__gte=age),
            )

        if income_condition:
            queryset = queryset.filter(income_condition__icontains=income_condition)

        if deadline_status:
            queryset = queryset.filter(deadline_status=deadline_status)

        normalized_keyword = normalize_popular_search_keyword(keyword)

        if normalized_keyword and self.request.user.is_authenticated:
            SearchHistory.objects.create(
                user=self.request.user,
                keyword=normalized_keyword,
            )

        record_popular_search_keyword(keyword)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        try:
            limit = int(request.query_params.get("limit", 20))
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            return error_response(
                message="limit, offset은 숫자여야 합니다.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        limit = max(1, min(limit, 100))
        offset = max(0, offset)

        page_queryset = queryset[offset:offset + limit]

        serializer = self.get_serializer(page_queryset, many=True)
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


# ---------------------------------------------------------
# 인기 검색어 TOP 10
# ---------------------------------------------------------
class PopularSearchKeywordListView(generics.ListAPIView):
    """
    GET /api/policies/popular-searches/
    """

    serializer_class = PopularSearchKeywordSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return PopularSearchKeyword.objects.filter(count__gt=0).order_by("-count", "keyword")[:10]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)


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
