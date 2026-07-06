from django.db import models
from django.conf import settings


class Policy(models.Model):
    """
    정책/창업공고/훈련과정 통합 모델 (opportunities.json 기준)
    출처: 온통청년(policy) / K-Startup(startup_notice) / 고용24(training)
    고유키: item_id (예: policy_20260605005400113228)
    """

    SOURCE_CATEGORY_CHOICES = [
        ("policy", "정책"),
        ("startup_notice", "창업공고"),
        ("training", "훈련과정"),
    ]

    DEADLINE_STATUS_CHOICES = [
        ("upcoming", "예정"),
        ("ongoing", "진행중"),
        ("closing_soon", "마감임박"),
        ("closed", "마감"),
        ("unknown", "미확인"),
    ]

    # 기본 식별 정보
    item_id = models.CharField(max_length=100, primary_key=True)
    source_category = models.CharField(
        max_length=30, choices=SOURCE_CATEGORY_CHOICES, db_index=True
    )
    title = models.CharField(max_length=300)
    domain = models.CharField(max_length=200, blank=True)

    # 상세 내용
    policy_summary = models.TextField(blank=True)
    participation_target = models.CharField(max_length=300, blank=True)
    region_codes = models.JSONField(default=list, blank=True)

    # 정책 전용 필드 (policies.json에서 join하여 보충 — 정승 담당)
    income_condition = models.TextField(blank=True, default="")

    # 신청 대상 연령 (참여 대상 필터링용, null이면 연령 제한 없음으로 취급)
    age_min = models.IntegerField(null=True, blank=True)
    age_max = models.IntegerField(null=True, blank=True)

    # 신청 기간
    application_period_text = models.CharField(max_length=200, blank=True)
    application_start_date = models.DateField(null=True, blank=True)
    application_end_date = models.DateField(null=True, blank=True)

    # 링크
    application_url = models.URLField(max_length=500, blank=True)
    source_url = models.URLField(max_length=500, blank=True)
    source_url_2 = models.URLField(max_length=500, blank=True)

    # 메타 정보
    info_score = models.IntegerField(default=0)
    needs_detail_check = models.BooleanField(default=False)

    # 정승 담당: 데이터 적재/마감 갱신 시 관리 (update_deadlines)
    deadline_status = models.CharField(
        max_length=20, choices=DEADLINE_STATUS_CHOICES, default="unknown", db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "policies"
        verbose_name = "정책"
        verbose_name_plural = "정책"
        indexes = [
            models.Index(fields=["source_category"]),
            models.Index(fields=["deadline_status"]),
        ]

    def __str__(self):
        return f"[{self.source_category}] {self.title}"


class Scrap(models.Model):
    """사용자별 스크랩한 정책"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scraps"
    )
    policy = models.ForeignKey(
        Policy, on_delete=models.CASCADE, related_name="scrapped_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "scraps"
        verbose_name = "스크랩"
        verbose_name_plural = "스크랩"
        unique_together = ("user", "policy")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.policy.title}"


class SearchHistory(models.Model):
    """사용자 검색 기록"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="search_history"
    )
    keyword = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "search_history"
        verbose_name = "검색 기록"
        verbose_name_plural = "검색 기록"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.keyword}"


class ViewedPolicy(models.Model):
    """최근 본 공고"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="viewed_policies"
    )
    policy = models.ForeignKey(
        Policy, on_delete=models.CASCADE, related_name="viewed_by"
    )
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "viewed_policies"
        verbose_name = "최근 본 공고"
        verbose_name_plural = "최근 본 공고"
        unique_together = ("user", "policy")
        ordering = ["-viewed_at"]

    def __str__(self):
        return f"{self.user} - {self.policy.title}"