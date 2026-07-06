# 05. API 명세서

**작성자**: 한경찬 (Django Core Backend Lead)
**작성일**: 2026-07-06
**Base URL**: `http://localhost/api/` (Nginx 경유) / `http://localhost:8000/api/` (Django 직접)

> 표기 기준: ✅ 코드(views.py/serializers.py/models.py) 직접 확인 + 테스트 코드로 검증됨 / ⚠️ 코드 일부만 확인되었거나 미검증 추정치 — 실제 값과 다를 수 있으니 사용 전 재확인 권장

---

## 0. 공통 사항

### 0.1 공통 응답 형식 ✅

모든 API는 아래 형식으로 응답한다 (`apps/common/responses.py`, `apps/common/exceptions.py` 기준).

**성공 응답**
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지",
  "error": null
}
```

**실패 응답** (DRF가 처리하는 예외, DRF가 처리 못 하는 예외 모두 동일 형식)
```json
{
  "success": false,
  "data": null,
  "message": "실패 사유 메시지",
  "error": { ... } 또는 문자열 또는 null
}
```

| 상황 | status code |
|---|---|
| 서버 내부 오류(DB 오류, 예상 못한 버그 등) | 500 |
| 입력값 검증 실패 | 400 |
| 인증 필요 | 401 |
| 권한 없음 | 403 |
| 리소스 없음 | 404 |

### 0.2 인증 방식 ✅

- JWT (`rest_framework_simplejwt`)
- 요청 헤더: `Authorization: Bearer {access_token}`
- Access token 수명: 60분, Refresh token 수명: 7일, refresh 시 재발급(`ROTATE_REFRESH_TOKENS=True`)

### 0.3 기본 권한 정책 ✅

- 전역 기본값: `IsAuthenticatedOrReadOnly` (읽기는 누구나, 쓰기는 로그인 필요)
- 단, 개별 View에서 `permission_classes`로 재정의된 경우 해당 설정이 우선함 (아래 각 항목에 명시)

---

## 1. 인증 (`/api/auth/`) ✅

| Method | URL | 이름 | 인증 필요 |
|---|---|---|---|
| POST | `/api/auth/signup/` | 회원가입 | ✗ |
| POST | `/api/auth/login/` | 로그인 | ✗ |
| POST | `/api/auth/token/refresh/` | 토큰 갱신 | ✗ |
| GET | `/api/auth/me/` | 내 정보 조회 | ✓ |
| PATCH | `/api/auth/profile/` | 프로필 수정 | ✓ |

### POST `/api/auth/signup/` ✅

**Request**
```json
{
  "username": "testuser01",
  "email": "testuser01@example.com",
  "password": "testpass1234",
  "password_confirm": "testpass1234"
}
```

**검증 규칙**
- `password`, `password_confirm` 8자 이상 (`AUTH_PASSWORD_VALIDATORS` + serializer 자체 검증)
- `email` 형식 검증, 중복 이메일 거부
- `password` ≠ `password_confirm` 이면 거부

**Response (201)**: 생성된 사용자 정보 (필드 상세 ⚠️ 미확인)

### POST `/api/auth/login/` ✅

**Request**
```json
{
  "email": "testuser01@example.com",
  "password": "testpass1234"
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  },
  "message": "...",
  "error": null
}
```

### GET `/api/auth/me/` ✅

인증 필요. 미인증 시 401/403.

### PATCH `/api/auth/profile/` ⚠️

인증 필요. `UserProfile` 필드(`age`, `region`, `interests`, `profile_image_url`)를 수정할 것으로 추정되나, `ProfileUpdateView`/`UserProfile` 시리얼라이저 원본을 직접 확인하지 못함. **사용 전 `apps/users/serializers.py`, `apps/users/models.py` 확인 필요.**

---

## 2. 정책 (`/api/policies/`) ✅

| Method | URL | 이름 | 인증 필요 |
|---|---|---|---|
| GET | `/api/policies/` | 목록/검색 | ✗ |
| GET | `/api/policies/{item_id}/` | 상세 조회 | ✗ (로그인 시 최근 본 공고 자동 기록) |
| GET | `/api/policies/scraps/` | 내 스크랩 목록 | ✓ |
| POST | `/api/policies/scraps/` | 스크랩 추가 | ✓ |
| DELETE | `/api/policies/scraps/{item_id}/` | 스크랩 삭제 | ✓ |
| GET | `/api/policies/search-history/` | 검색 기록 조회 | ✓ |
| GET | `/api/policies/viewed/` | 최근 본 공고 조회 | ✓ |

### GET `/api/policies/` ✅

**Query Parameters**

| 파라미터 | 설명 | 예시 |
|---|---|---|
| `keyword` | `title`, `policy_summary`에 대한 부분일치 검색 | `?keyword=월세` |
| `region` | `region_codes`(JSON 리스트) 안에 포함 여부 검색 | `?region=서울` |
| `source_category` | `policy` / `startup_notice` / `training` | `?source_category=policy` |
| `age` | 나이 조건. `age_min`/`age_max`가 `null`인 정책은 연령 제한 없음으로 간주해 항상 포함 | `?age=25` |

여러 파라미터는 AND 조건으로 결합됨. `keyword`로 검색 시 로그인 상태면 `SearchHistory`에 자동 기록됨.

**Response data (목록 항목당 필드)** — `PolicyListSerializer` 기준
```json
{
  "item_id": "policy_20260605005400113228",
  "source_category": "policy",
  "title": "서울시 청년월세 지원사업",
  "domain": "주거",
  "participation_target": "만 19~34세 무주택 청년",
  "region_codes": ["서울"],
  "application_end_date": "2026-08-31",
  "deadline_status": "ongoing",
  "info_score": 85
}
```

### GET `/api/policies/{item_id}/` ✅

**Response data**: `Policy` 모델 전체 필드 (`PolicyDetailSerializer`, `fields = "__all__"`)

| 필드 | 타입 | 비고 |
|---|---|---|
| `item_id` | string (PK) | |
| `source_category` | string | `policy`/`startup_notice`/`training` |
| `title` | string | |
| `domain` | string | |
| `policy_summary` | string | |
| `participation_target` | string | |
| `region_codes` | array | |
| `income_condition` | string | |
| `application_period_text` | string | |
| `application_start_date` | date, nullable | |
| `application_end_date` | date, nullable | |
| `application_url` | string | |
| `source_url` | string | |
| `source_url_2` | string | |
| `info_score` | integer | |
| `needs_detail_check` | boolean | |
| `deadline_status` | string | `upcoming`/`ongoing`/`closing_soon`/`closed`/`unknown` |
| `age_min` | integer, nullable | 2026-07-06 신규 추가 |
| `age_max` | integer, nullable | 2026-07-06 신규 추가 |
| `created_at` / `updated_at` | datetime | |

### POST `/api/policies/scraps/` ✅

**Request**
```json
{ "policy": "policy_20260605005400113228" }
```
> ⚠️ 주의: 필드명은 `item_id`가 아니라 **`policy`** (Policy의 PK가 `item_id`이므로 PK 값을 그대로 넣음)

**검증 규칙**: 동일 사용자가 동일 정책을 이미 스크랩했으면 400 에러("이미 스크랩한 정책입니다.")

**Response (201)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user": 3,
    "policy": "policy_20260605005400113228",
    "policy_detail": { "item_id": "...", "title": "..." },
    "created_at": "2026-07-06T10:00:00+09:00"
  },
  "message": "스크랩되었습니다.",
  "error": null
}
```

### DELETE `/api/policies/scraps/{item_id}/` ✅

`{item_id}`는 스크랩 PK가 아니라 **정책의 item_id**. 스크랩 내역 없으면 404.

### GET `/api/policies/search-history/` ✅

최근 20건, 최신순. 필드: `id`, `user`, `keyword`, `created_at`

### GET `/api/policies/viewed/` ✅

최근 20건, 최신순. 필드: `id`, `user`, `policy`, `policy_detail`, `viewed_at`

---

## 3. 마이페이지 (`/api/mypage/`) ✅

| Method | URL | 이름 | 비고 |
|---|---|---|---|
| GET | `/api/mypage/` | 마이페이지 요약 | `MypageSummaryView` |
| GET | `/api/mypage/profile/` | 내 프로필 조회 | `MeView` 재사용 (1번 항목과 동일 로직) |
| PATCH | `/api/mypage/profile/update/` | 프로필 수정 | `ProfileUpdateView` 재사용 |
| GET | `/api/mypage/scraps/` | 스크랩 목록 | `ScrapListCreateView` 재사용 |
| GET | `/api/mypage/search-history/` | 검색 기록 | `SearchHistoryListView` 재사용 |
| GET | `/api/mypage/viewed-policies/` | 최근 본 공고 | `ViewedPolicyListView` 재사용 |
| GET | `/api/mypage/notifications/` | 내 알림 | `NotificationListView` 재사용 |

### GET `/api/mypage/` ✅

`users`, `policies`, `notifications`의 기존 데이터를 모아서 보여주는 순수 조회 뷰 (새 모델 없음).

**Response data**
```json
{
  "profile": { "age": 25, "region": "서울", "interests": ["주거"], "profile_image_url": "https://..." },
  "scrap_count": 3,
  "recent_searches": ["월세 지원", "청년 창업"],
  "recent_viewed_policies": [
    { "item_id": "policy_...", "title": "서울시 청년월세 지원사업", "viewed_at": "2026-07-06T10:00:00+09:00" }
  ],
  "unread_notification_count": 2
}
```

- `recent_searches`: 최근 검색어 5개(키워드 문자열만, 최신순)
- `recent_viewed_policies`: 최근 본 공고 5개(요약 정보만)
- `profile`이 없는 사용자(프로필 미생성)는 빈 객체 `{}` 반환

> ⚠️ 코드 정리 참고: `apps/mypage/views.py`가 아직 `success_response`를 로컬로 정의해서 쓰고 있음. 공통 예외 처리 작업 시 이 파일이 누락된 것으로 보이며, 일관성을 위해 `apps.common.responses`로 교체 권장.

---

## 4. 알림 (`/api/notifications/`) ✅

| Method | URL | 이름 | 인증 필요 |
|---|---|---|---|
| GET | `/api/notifications/` | 알림 목록 | ✓ |
| PATCH | `/api/notifications/{id}/read/` | 읽음 처리 | ✓ |
| DELETE | `/api/notifications/{id}/` | 알림 삭제 | ✓ |

### GET `/api/notifications/` ✅

**Response data**
```json
{
  "notifications": [
    {
      "id": 1,
      "notification_type": "deadline_reminder",
      "title": "마감 임박 안내",
      "message": "스크랩하신 정책의 신청 마감이 임박했습니다.",
      "policy": "policy_20260605005400113228",
      "policy_title": "서울시 청년월세 지원사업",
      "is_read": false,
      "created_at": "2026-07-06T10:00:00+09:00"
    }
  ],
  "unread_count": 3
}
```

본인 알림만 반환됨(코드/테스트로 검증). `policy`가 없는 알림(정책과 무관한 공지 등)은 `policy_title`이 `null`로 반환됨. `notification_type`의 실제 choice 값 목록은 `apps/notifications/models.py` 추가 확인 필요.

### PATCH `/api/notifications/{id}/read/` ✅

본인 알림이 아니면 404. 성공 시 `is_read=true`로 갱신.

### DELETE `/api/notifications/{id}/` ✅

본인 알림이 아니면 404.

---

## 5. 커뮤니티 (`/api/community/`) ✅

| Method | URL | 이름 | 인증 필요 |
|---|---|---|---|
| GET | `/api/community/posts/` | 게시글 목록 | ✗ |
| POST | `/api/community/posts/` | 게시글 작성 | ✓ |
| GET | `/api/community/posts/{post_id}/` | 게시글 상세 (조회수 +1) | ✗ |
| PATCH | `/api/community/posts/{post_id}/` | 게시글 수정 | ✓ (작성자 본인만) |
| DELETE | `/api/community/posts/{post_id}/` | 게시글 삭제 | ✓ (작성자 본인 또는 관리자) |

### POST `/api/community/posts/` ✅

**Request**
```json
{ "title": "제목", "content": "본문" }
```

**Response (201)**: 생성된 게시글 상세 데이터 (`CommunityPostDetailSerializer`)

**검증 실패 시 (400)**
```json
{
  "success": false,
  "data": null,
  "message": "입력값이 올바르지 않습니다.",
  "error": { "field": "title", "reason": "이 필드는 필수입니다." }
}
```

### PATCH / DELETE `/api/community/posts/{post_id}/` ✅

작성자 본인이 아니면 `IsAuthorOrReadOnly` 권한 클래스에 의해 403.

---

## 6. 프로필 이미지 업로드 (`/api/uploads/`) ✅

| Method | URL | 인증 필요 |
|---|---|---|
| POST | `/api/uploads/profile-image/` | ✓ |
| DELETE | `/api/uploads/profile-image/` | ✓ |

### POST `/api/uploads/profile-image/` ✅

**Request**: `multipart/form-data`, key `image` (파일)

**검증 규칙**
- 허용 확장자: `jpg`, `jpeg`, `png`, `webp`
- 최대 크기: 5MB
- 실제 이미지 파일이어야 함(Pillow 검증)

**Response (201)**
```json
{
  "success": true,
  "data": { "profile_image_url": "https://example-bucket.s3.amazonaws.com/profile/uploaduser.jpg" },
  "message": "프로필 이미지가 업로드되었습니다.",
  "error": null
}
```

업로드 성공 시 기존 이미지는 자동 삭제됨. S3 오류 시 502 응답.

> ⚠️ 실제 S3 업로드 동작은 미검증 상태 (정승의 AWS 버킷/IAM 키 수신 대기 중, 현재는 코드 레벨 + mock 테스트로만 검증됨)

### DELETE `/api/uploads/profile-image/` ✅

프로필 이미지를 삭제하고 `profile_image_url`을 `null`로 변경.

---

## 7. AI 챗봇 (`/api/ai/`) ⚠️

윤승혁 담당 영역. `apps/chat_rag/urls.py`, `views.py` 원본을 이번 문서 작성 과정에서 직접 확인하지 못했다. 아래는 지침서 및 이전 세션의 실제 curl 검증 결과를 바탕으로 한 **참고용 정보**이며, 최종 확정은 윤승혁 확인 필요.

### POST `/api/ai/chat/` (경로 추정)

**Request (추정)**
```json
{
  "message": "서울에 사는 25세 청년이 받을 수 있는 월세 지원 정책 알려줘",
  "user_profile": { "age": 25, "region": "서울", "interests": ["주거"] },
  "top_k": 3,
  "conversation_id": "..."
}
```

**Response (실제 curl 검증됨, 2026-07-05 세션)**
```json
{
  "answer": "...",
  "recommendations": [ { "title": "...", "summary": "...", "eligibility": "...", "deadline_status": "...", "source_url": "...", "application_url": "..." } ],
  "sources": [],
  "warnings": [],
  "error": null,
  "meta": { "external_used": false, "internal_search_sufficient": true }
}
```

---

## 8. 문서 신뢰도 요약

| 앱 | 신뢰도 | 비고 |
|---|---|---|
| users (인증) | 높음 | urls.py 확인, signup/login 필드 테스트로 검증. profile 상세는 미확인 |
| policies | 매우 높음 | models/views/serializers 전부 원본 확인 + 테스트 검증 완료 |
| notifications | 높음 | urls.py/views.py/serializers.py 전부 원본 확인 완료 |
| community | 높음 | views.py 원본 확인 + 테스트 검증 완료 (serializer 필드 상세는 미확인) |
| uploads | 매우 높음 | views/serializers 전부 원본 확인 + 테스트 검증 완료 |
| mypage | 높음 | views.py 원본 확인 완료 (단, `success_response` 로컬 정의 잔존 — 정리 필요) |
| chat_rag (AI) | 낮음 | 코드 미확인, 이전 curl 테스트 결과만 참고 |

**남은 것**: `chat_rag` 영역만 윤승혁 확인이 필요하고, 나머지는 전부 코드 원본 기준으로 신뢰도 "높음" 이상 확보됨. 추가로 `apps/mypage/views.py`의 `success_response` 로컬 정의를 공통 모듈로 교체하는 정리 작업이 남아있음(기능 영향 없음, 일관성 개선용).
