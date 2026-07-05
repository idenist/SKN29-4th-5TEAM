from django.urls import path

from apps.users.views import MeView, ProfileUpdateView
from apps.policies.views import (
    ScrapListCreateView,
    SearchHistoryListView,
    ViewedPolicyListView,
)
from apps.notifications.views import NotificationListView

from .views import MypageSummaryView

urlpatterns = [
    path("", MypageSummaryView.as_view(), name="mypage-summary"),

    # 아래는 각 앱에 이미 구현된 뷰를 /api/mypage/... 경로로도 접근 가능하게 재사용한 것.
    # 실제 로직은 users / policies / notifications 앱에 있음.
    path("profile/", MeView.as_view(), name="mypage-profile-get"),
    path("profile/update/", ProfileUpdateView.as_view(), name="mypage-profile-update"),
    path("scraps/", ScrapListCreateView.as_view(), name="mypage-scraps"),
    path("search-history/", SearchHistoryListView.as_view(), name="mypage-search-history"),
    path("viewed-policies/", ViewedPolicyListView.as_view(), name="mypage-viewed-policies"),
    path("notifications/", NotificationListView.as_view(), name="mypage-notifications"),
]