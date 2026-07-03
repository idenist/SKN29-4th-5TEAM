from django.urls import path
from .views import (
    PolicyListView,
    PolicyDetailView,
    ScrapListCreateView,
    ScrapDeleteView,
    SearchHistoryListView,
    ViewedPolicyListView,
)

app_name = "policies"

urlpatterns = [
    # 정책 목록/검색
    path("", PolicyListView.as_view(), name="policy-list"),
    # 스크랩
    path("scraps/", ScrapListCreateView.as_view(), name="scrap-list-create"),
    path("scraps/<str:item_id>/", ScrapDeleteView.as_view(), name="scrap-delete"),
    # 검색 기록
    path("search-history/", SearchHistoryListView.as_view(), name="search-history-list"),
    # 최근 본 공고
    path("viewed/", ViewedPolicyListView.as_view(), name="viewed-list"),
    # 정책 상세 (동적 경로는 반드시 맨 마지막)
    path("<str:item_id>/", PolicyDetailView.as_view(), name="policy-detail"),
]