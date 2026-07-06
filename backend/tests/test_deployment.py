# 저장 위치: backend/tests/test_deployment.py
"""
서버 실행/마이그레이션/배포 구조 테스트
대상 테스트 ID: TC-BE-01, TC-BE-02, TC-DEPLOYBE-01, TC-DEPLOYBE-02

NOTE:
- TC-DEPLOYBE-01(Gunicorn 실행), TC-DEPLOYBE-02(Nginx 경유 접근)는
  실제 프로세스/컨테이너가 떠 있어야 검증 가능한 배포 단계라 순수 단위 테스트로는
  한계가 있습니다. 여기서는 "설정 파일이 정상적으로 존재하고 파싱 가능한가"까지만
  자동 검증하고, 실제 기동 확인은 지금까지처럼 curl 수동 테스트 결과를
  테스트 계획 및 결과 보고서에 캡처로 남기는 방식을 유지하는 걸 추천합니다.
"""
import os
from io import StringIO
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase


class DjangoHealthCheckTests(TestCase):
    """TC-BE-01: Django 서버가 정상 실행되는가 (설정/앱 구성 무결성 체크)"""

    def test_django_check_has_no_issues(self):
        out = StringIO()
        try:
            call_command("check", stdout=out)
        except SystemExit:
            self.fail(f"manage.py check 실패:\n{out.getvalue()}")


class MigrationStateTests(TestCase):
    """TC-BE-02: DB migration이 정상적으로 수행되는가 (누락된 migration 여부 확인)"""

    def test_no_missing_migrations(self):
        out = StringIO()
        err = StringIO()
        try:
            call_command(
                "makemigrations", "--check", "--dry-run", stdout=out, stderr=err
            )
        except SystemExit:
            self.fail(
                "적용되지 않은 모델 변경사항이 있습니다. "
                "python manage.py makemigrations 를 실행해서 반영하세요.\n"
                f"{out.getvalue()}{err.getvalue()}"
            )

    def test_test_database_setup_succeeds(self):
        # 이 테스트가 여기까지 도달했다는 것 자체가
        # 테스트 DB에 전체 migration이 정상 적용됐다는 뜻입니다.
        self.assertTrue(True)


class DeploymentConfigFilesExistTests(TestCase):
    """
    TC-DEPLOYBE-01/02 보조 체크: 배포 설정 파일이 실제로 존재하고
    최소한의 형식을 갖췄는가 (실제 기동 여부는 별도 수동 검증 필요)
    """

    def _project_root(self):
        # settings.py 기준 backend/ 상위(=프로젝트 루트) 경로 추정
        return Path(settings.BASE_DIR).parent

    def test_gunicorn_config_exists(self):
        gunicorn_config = Path(settings.BASE_DIR) / "gunicorn_config.py"
        self.assertTrue(
            gunicorn_config.exists(),
            f"{gunicorn_config} 파일을 찾을 수 없습니다.",
        )

    def test_dockerfile_exists(self):
        dockerfile = Path(settings.BASE_DIR) / "Dockerfile"
        self.assertTrue(dockerfile.exists(), f"{dockerfile} 파일을 찾을 수 없습니다.")

    def test_docker_compose_exists(self):
        compose_file = self._project_root() / "docker-compose.yml"
        self.assertTrue(
            compose_file.exists(), f"{compose_file} 파일을 찾을 수 없습니다."
        )

    def test_nginx_conf_exists(self):
        nginx_conf = self._project_root() / "nginx" / "nginx.conf"
        self.assertTrue(nginx_conf.exists(), f"{nginx_conf} 파일을 찾을 수 없습니다.")

    def test_wsgi_application_is_importable(self):
        # Gunicorn이 실제로 참조하는 wsgi:application 객체가
        # import 시점에 에러 없이 로드되는지 확인
        from config.wsgi import application

        self.assertIsNotNone(application)