# 저장 위치: backend/tests/test_policy.py  (덮어쓰기)
"""
정책/스크랩 테스트
대상 테스트 ID: TC-POLICY-01, TC-POLICY-02, TC-POLICY-03, TC-SCRAP-01

NOTE:
- age 필터 테스트(PolicyAgeFilterTests)는 PolicyListView.get_queryset()에
  age_min/age_max 필터링 로직이 반영되어 있어야 통과합니다.
  아직 반영 전이라면 이 클래스는 실패하는 게 정상이니 당황하지 마세요.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.policies.models import Policy

User = get_user_model()


def create_policy(**overrides):
    defaults = {
        "item_id": "TEST-POLICY-001",
        "title": "서울시 청년월세 지원사업",
        "source_category": "policy",
        "region_codes": ["서울"],
        "deadline_status": "ongoing",
        "age_min": None,
        "age_max": None,
    }
    defaults.update(overrides)
    return Policy.objects.create(**defaults)


class PolicyListTests(APITestCase):
    """TC-POLICY-01: 정책 목록 API가 정상 응답하는가"""

    def setUp(self):
        create_policy(item_id="TEST-001", title="서울 청년월세 지원")
        create_policy(item_id="TEST-002", title="부산 청년 창업 지원", region_codes=["부산"])

    def test_policy_list_returns_200(self):
        response = self.client.get(reverse("policies:policy-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_policy_list_contains_created_policies(self):
        response = self.client.get(reverse("policies:policy-list"))
        body = str(response.data)
        self.assertIn("TEST-001", body)
        self.assertIn("TEST-002", body)


class PolicyDetailTests(APITestCase):
    """TC-POLICY-02: 정책 상세 API가 item_id 기준으로 조회되는가"""

    def setUp(self):
        self.policy = create_policy(item_id="TEST-DETAIL-001", title="테스트 상세 정책")

    def test_policy_detail_by_item_id(self):
        url = reverse("policies:policy-detail", kwargs={"item_id": self.policy.item_id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("테스트 상세 정책", str(response.data))

    def test_policy_detail_404_for_unknown_item_id(self):
        url = reverse("policies:policy-detail", kwargs={"item_id": "NON-EXISTENT-ID"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_viewed_policy_recorded_for_logged_in_user(self):
        user = User.objects.create_user(
            username="viewer", email="viewer@example.com", password="testpass1234"
        )
        self.client.force_authenticate(user=user)
        url = reverse("policies:policy-detail", kwargs={"item_id": self.policy.item_id})
        self.client.get(url)

        from apps.policies.models import ViewedPolicy
        self.assertTrue(
            ViewedPolicy.objects.filter(user=user, policy=self.policy).exists()
        )


class PolicySearchFilterTests(APITestCase):
    """TC-POLICY-03: 정책 검색 API가 keyword, region, source_category 필터를 처리하는가"""

    def setUp(self):
        create_policy(
            item_id="SEOUL-001", title="서울 청년월세 지원",
            region_codes=["서울"], source_category="policy",
        )
        create_policy(
            item_id="BUSAN-001", title="부산 청년 창업 지원",
            region_codes=["부산"], source_category="startup_notice",
        )

    def test_filter_by_keyword(self):
        response = self.client.get(reverse("policies:policy-list"), {"keyword": "월세"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = str(response.data)
        self.assertIn("SEOUL-001", body)
        self.assertNotIn("BUSAN-001", body)

    def test_filter_by_region(self):
        response = self.client.get(reverse("policies:policy-list"), {"region": "부산"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = str(response.data)
        self.assertIn("BUSAN-001", body)
        self.assertNotIn("SEOUL-001", body)

    def test_filter_by_source_category(self):
        response = self.client.get(
            reverse("policies:policy-list"), {"source_category": "startup_notice"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = str(response.data)
        self.assertIn("BUSAN-001", body)
        self.assertNotIn("SEOUL-001", body)


class PolicyAgeFilterTests(APITestCase):
    """
    TC-POLICY-03 확장: age 필터
    NOTE: views.py에 age 필터 로직이 반영되어 있어야 통과합니다.
    """

    def setUp(self):
        create_policy(
            item_id="AGE-LIMITED-001", title="청년 한정 정책",
            age_min=19, age_max=34,
        )
        create_policy(
            item_id="AGE-OPEN-001", title="연령 제한 없는 정책",
            age_min=None, age_max=None,
        )
        create_policy(
            item_id="AGE-SENIOR-001", title="중장년 정책",
            age_min=40, age_max=64,
        )

    def test_age_within_range_included(self):
        response = self.client.get(reverse("policies:policy-list"), {"age": 25})
        body = str(response.data)
        self.assertIn("AGE-LIMITED-001", body)
        self.assertIn("AGE-OPEN-001", body)
        self.assertNotIn("AGE-SENIOR-001", body)

    def test_age_outside_range_excluded(self):
        response = self.client.get(reverse("policies:policy-list"), {"age": 50})
        body = str(response.data)
        self.assertIn("AGE-SENIOR-001", body)
        self.assertIn("AGE-OPEN-001", body)
        self.assertNotIn("AGE-LIMITED-001", body)


class ScrapTests(APITestCase):
    """TC-SCRAP-01: 로그인 사용자가 정책을 스크랩할 수 있는가"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="scrapuser", email="scrapuser@example.com", password="testpass1234"
        )
        self.policy = create_policy(item_id="SCRAP-TARGET-001", title="스크랩 대상 정책")
        self.client.force_authenticate(user=self.user)

    def test_scrap_requires_login(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            reverse("policies:scrap-list-create"),
            {"policy": self.policy.item_id},
            format="json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_create_scrap(self):
        response = self.client.post(
            reverse("policies:scrap-list-create"),
            {"policy": self.policy.item_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_scrap_rejected(self):
        self.client.post(
            reverse("policies:scrap-list-create"),
            {"policy": self.policy.item_id},
            format="json",
        )
        response = self.client.post(
            reverse("policies:scrap-list-create"),
            {"policy": self.policy.item_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_scrap_appears_in_list(self):
        self.client.post(
            reverse("policies:scrap-list-create"),
            {"policy": self.policy.item_id},
            format="json",
        )
        response = self.client.get(reverse("policies:scrap-list-create"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.policy.item_id, str(response.data))

    def test_delete_scrap(self):
        self.client.post(
            reverse("policies:scrap-list-create"),
            {"policy": self.policy.item_id},
            format="json",
        )
        url = reverse("policies:scrap-delete", kwargs={"item_id": self.policy.item_id})
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])