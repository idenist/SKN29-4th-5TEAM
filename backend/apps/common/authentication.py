# 저장 위치: backend/apps/common/authentication.py  (신규 파일)
"""
기본 JWTAuthentication은 Authorization 헤더에 토큰이 "있기만" 하면
만료/변조 여부와 상관없이 검증을 시도하고, 실패 시 AuthenticationFailed(401)를
던진다. 이 예외는 DRF의 인증 단계에서 발생하기 때문에, 뷰의
permission_classes가 AllowAny거나 IsAuthenticatedOrReadOnly여도
권한 체크 자체에 도달하지 못하고 그 자리에서 401로 막힌다.

프론트가 만료된/손상된 토큰을 들고 있는 상태로 로그인, 정책 조회처럼
비로그인 사용자도 접근 가능해야 하는 API를 호출하면 이 문제가 발생한다
(예: "이 토큰은 모든 타입의 토큰에 대해 유효하지 않습니다" 401 오류로
정책 검색/로그인 자체가 막히는 현상).

OptionalJWTAuthentication은 토큰이 유효하면 기존과 동일하게 인증하고,
토큰이 없거나 무효/만료된 경우 예외를 던지는 대신 인증되지 않은
요청(AnonymousUser)으로 취급한다. 그 결과:
- AllowAny, IsAuthenticatedOrReadOnly(GET) 뷰: 무효 토큰이 있어도 정상 동작
- IsAuthenticated 뷰: 여전히 401 (권한 단계에서 정상적으로 거부됨)
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class OptionalJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None
