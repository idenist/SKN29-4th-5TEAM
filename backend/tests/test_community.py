# 저장 위치: backend/tests/test_community.py  (신규 파일)
"""
커뮤니티 테스트
대상 테스트 ID: TC-COMM-01, TC-COMM-02

NOTE (확인 필요):
- CommunityPost 모델 필드명(title/content/author)이 실제
  apps/community/models.py와 다르면 create_post()를 수정하세요.
"""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.community.models import CommunityPost

User = get_user_model()


def create_post(author, **overrides):
    defaults = {"title": "테스트 게시글", "content": "테스트 본문 내용입니다."}
    defaults.update(overrides)
    return CommunityPost.objects.create(author=author, **defaults)


class CommunityWriteTests(APITestCase):
    """TC-COMM-01: 커뮤니티 게시글 작성 API가 로그인 사용자에게만 허용되는가"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="writer", email="writer@example.com", password="testpass1234"
        )
        self.url = reverse("community-post-list")

    def test_create_post_requires_login(self):
        response = self.client.post(
            self.url, {"title": "제목", "content": "본문"}, format="json"
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_authenticated_user_can_create_post(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url, {"title": "제목", "content": "본문"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CommunityPost.objects.filter(title="제목").exists())

    def test_list_posts_does_not_require_login(self):
        create_post(author=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CommunityAuthorPermissionTests(APITestCase):
    """TC-COMM-02: 게시글 수정/삭제가 작성자 본인에게만 허용되는가"""

    def setUp(self):
        self.author = User.objects.create_user(
            username="author", email="author@example.com", password="testpass1234"
        )
        self.other_user = User.objects.create_user(
            username="other", email="other@example.com", password="testpass1234"
        )
        self.post = create_post(author=self.author)
        self.url = reverse("community-post-detail", kwargs={"post_id": self.post.id})

    def test_author_can_update_own_post(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.patch(self.url, {"title": "수정된 제목"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_author_can_delete_own_post(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.delete(self.url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

    def test_other_user_cannot_update_post(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(self.url, {"title": "무단 수정 시도"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_user_cannot_delete_post(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(CommunityPost.objects.filter(id=self.post.id).exists())


class CommunityViewCountTests(APITestCase):
    """게시글 상세 조회수는 같은 상세 진입의 중복 요청에서 한 번만 증가해야 한다."""

    def setUp(self):
        self.author = User.objects.create_user(
            username="view-author", email="view-author@example.com", password="testpass1234"
        )
        self.post = create_post(author=self.author)
        self.url = reverse("community-post-detail", kwargs={"post_id": self.post.id})

    def test_duplicate_detail_requests_in_same_session_increment_once(self):
        first_response = self.client.get(self.url)
        second_response = self.client.get(self.url)

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)

        self.post.refresh_from_db()
        self.assertEqual(self.post.view_count, 1)

    def test_detail_requests_from_different_sessions_increment_separately(self):
        other_client = APIClient()

        self.client.get(self.url)
        other_client.get(self.url)

        self.post.refresh_from_db()
        self.assertEqual(self.post.view_count, 2)
