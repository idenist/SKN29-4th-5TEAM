# apps/policies/serializers.py

from rest_framework import serializers
from .models import Policy, Scrap, SearchHistory, ViewedPolicy, PopularSearchKeyword, PopularSearchKeyword


class PolicyListSerializer(serializers.ModelSerializer):
    """정책 목록 조회용 - 가벼운 필드만"""

    class Meta:
        model = Policy
        fields = [
            "item_id",
            "source_category",
            "title",
            "domain",
            "organization",
            "participation_target",
            "region_codes",
            "application_end_date",
            "deadline_status",
            "info_score",
        ]


class PolicyDetailSerializer(serializers.ModelSerializer):
    """정책 상세 조회용 - 전체 필드 (신규 필드는 all이라 자동 포함됨)"""

    class Meta:
        model = Policy
        fields = "__all__"


class ScrapSerializer(serializers.ModelSerializer):
    """스크랩 생성/조회용"""

    policy_detail = PolicyListSerializer(source="policy", read_only=True)

    class Meta:
        model = Scrap
        fields = ["id", "user", "policy", "policy_detail", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

    def validate(self, attrs):
        user = self.context["request"].user
        policy = attrs.get("policy")
        if Scrap.objects.filter(user=user, policy=policy).exists():
            raise serializers.ValidationError("이미 스크랩한 정책입니다.")
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ["id", "user", "keyword", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ViewedPolicySerializer(serializers.ModelSerializer):
    """최근 본 공고 - 조회용"""

    policy_detail = PolicyListSerializer(source="policy", read_only=True)

    class Meta:
        model = ViewedPolicy
        fields = ["id", "user", "policy", "policy_detail", "viewed_at"]
        read_only_fields = ["id", "user", "viewed_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        # update_or_create로 views.py에서 처리 예정 (중복 방지)
        return super().create(validated_data)


class PopularSearchKeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PopularSearchKeyword
        fields = ["keyword", "count", "last_searched_at"]
