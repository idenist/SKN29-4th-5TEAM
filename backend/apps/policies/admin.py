from django.contrib import admin

from .models import (
    Policy,
    Scrap,
    SearchHistory,
    ViewedPolicy,
    PopularSearchKeyword,
)


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = (
        "item_id", "title", "source_category", "organization",
        "deadline_status", "application_end_date", "created_at",
    )
    list_filter = ("source_category", "deadline_status")
    search_fields = ("item_id", "original_id", "title", "organization", "domain")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    fieldsets = (
        ("기본 정보", {
            "fields": (
                "item_id", "original_id", "source_category", "source_name",
                "title", "domain", "organization", "contact",
            )
        }),
        ("내용", {
            "fields": (
                "policy_summary", "participation_target", "benefit_text",
                "income_condition", "region_codes", "location",
                "age_min", "age_max",
            )
        }),
        ("신청/운영 기간", {
            "fields": (
                "application_period_text", "application_start_date", "application_end_date",
                "application_method",
                "program_period_text", "program_start_date", "program_end_date",
            )
        }),
        ("링크", {"fields": ("application_url", "source_url", "source_url_2")}),
        ("상태/메타", {"fields": ("deadline_status", "info_score", "needs_detail_check")}),
        ("원본 데이터", {"fields": ("raw_data",), "classes": ("collapse",)}),
        ("타임스탬프", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Scrap)
class ScrapAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "policy", "created_at")
    search_fields = ("user__email", "policy__title")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "keyword", "created_at")
    search_fields = ("user__email", "keyword")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


@admin.register(ViewedPolicy)
class ViewedPolicyAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "policy", "viewed_at")
    search_fields = ("user__email", "policy__title")
    list_filter = ("viewed_at",)
    ordering = ("-viewed_at",)


@admin.register(PopularSearchKeyword)
class PopularSearchKeywordAdmin(admin.ModelAdmin):
    list_display = ("id", "keyword", "count", "last_searched_at", "updated_at")
    search_fields = ("keyword",)
    ordering = ("-count", "keyword")
    readonly_fields = ("created_at", "updated_at")