# Django 백엔드 구현 문서

**프로젝트**: 청년 정책 추천 웹 서비스 "이젠, 안쉼"
**담당**: Django Core Backend Lead
**문서 범위**: 인증·권한, 핵심 데이터 모델, 정책·마이페이지·커뮤니티·업로드 API

---

## 1. 개요

본 문서는 Django 기반 백엔드의 핵심 구조인 사용자 인증, 데이터 모델, REST API 구현 내용을 정리한다. 백엔드는 Django REST Framework(DRF)와 JWT 인증을 기반으로 구축되었으며, PostgreSQL을 데이터베이스로 사용한다.

---

## 2. 데이터 모델

### 2.1 사용자 (CustomUser / UserProfile)

`CustomUser`는 Django의 `AbstractUser`를 확장하여 이메일을 로그인 식별자로 사용한다.

| 필드 | 설명 |
|---|---|
| `email` | 로그인 식별자 (unique) |
| `username` | 사용자명 |

`UserProfile`은 `CustomUser`와 1:1 관계로 연결되며, 개인화 추천 및 마이페이지에서 사용되는 사용자 속성을 저장한다.

| 필드 | 설명 |
|---|---|
| `age` | 연령 |
| `region` | 거주지 |
| `interests` | 관심 분야 (리스트) |
| `profile_image_url` | 프로필 이미지 URL |

### 2.2 정책 (Policy)

정책, 창업공고, 훈련과정 데이터를 통합 관리하는 모델.

| 필드 | 설명 |
|---|---|
| `item_id` | 고유 식별자 (PK) |
| `source_category` | 정책 / 창업공고 / 훈련과정 |
| `title`, `domain`, `policy_summary` | 정책 기본 정보 |
| `participation_target`, `region_codes` | 대상 조건 |
| `application_period_text`, `application_start_date`, `application_end_date` | 신청 기간 |
| `application_url`, `source_url` | 신청/출처 URL |
| `deadline_status` | 마감 상태 (예정/진행중/마감임박/마감/미확인) |
| `info_score`, `needs_detail_check` | 데이터 완성도 및 원문 확인 필요 여부 |

### 2.3 사용자 활동 모델

| 모델 | 설명 |
|---|---|
| `Scrap` | 사용자별 스크랩한 정책 (user, policy 1:N 관계) |
| `SearchHistory` | 사용자 검색 기록 (keyword, 생성 시각) |
| `ViewedPolicy` | 최근 조회한 정책 |
| `Notification` | 마감/변경 알림 |
| `CommunityPost` | 커뮤니티 게시글 |

---

## 3. 인증 및 권한

### 3.1 인증 방식

JWT(JSON Web Token) 기반 인증을 적용하였다 (`djangorestframework-simplejwt`).

| 항목 | 값 |
|---|---|
| Access Token 유효기간 | 60분 |
| Refresh Token 유효기간 | 7일 |
| Refresh Token 회전 | 적용 |
| 인증 헤더 | `Authorization: Bearer {access_token}` |

### 3.2 인증 API

| 기능 | Method | URL |
|---|---|---|
| 회원가입 | POST | `/api/auth/signup/` |
| 로그인 | POST | `/api/auth/login/` |
| 내 정보 조회 | GET | `/api/auth/me/` |
| 프로필 수정 | PATCH | `/api/auth/profile/` |

### 3.3 입력값 검증

| 항목 | 검증 기준 |
|---|---|
| 이메일 | 형식 검증(EmailField), 중복 가입 차단 |
| 비밀번호 | 최소 8자 이상, 비밀번호 확인 값과 일치 여부 검증 |
| 검증 실패 응답 | HTTP 400, 필드별 오류 메시지 반환 |

비밀번호 정책은 Django `AUTH_PASSWORD_VALIDATORS`(최소 길이, 사용자 정보 유사성, 일반 비밀번호, 숫자 전용 비밀번호 검증)로도 이중 적용되어 있다.

### 3.4 권한 정책

| 리소스 | 권한 기준 |
|---|---|
| 마이페이지, 스크랩, 검색 기록, 알림 | 로그인 사용자 본인 데이터만 접근 가능 |
| 커뮤니티 게시글 | 비로그인: 조회만 가능 / 로그인: 작성 가능 / 작성자 본인: 수정·삭제 가능 |
| 프로필 이미지 업로드 | 로그인 사용자만 가능 |

---

## 4. 정책 / 마이페이지 API

### 4.1 공통 응답 형식

모든 API는 아래 형식으로 응답을 통일한다.

```json
{
  "success": true,
  "data": {},
  "message": "",
  "error": null
}
```

### 4.2 정책 API

| 기능 | Method | URL | 설명 |
|---|---|---|---|
| 정책 목록/검색 | GET | `/api/policies/` | keyword, region, source_category 조건 검색 |
| 정책 상세 | GET | `/api/policies/{item_id}/` | item_id 기준 상세 조회 |
| 스크랩 목록/추가 | GET/POST | `/api/policies/scraps/` | 로그인 사용자 스크랩 관리 |
| 스크랩 삭제 | DELETE | `/api/policies/scraps/{item_id}/` | |
| 검색 기록 조회 | GET | `/api/policies/search-history/` | 최근 20건 |
| 최근 본 공고 조회 | GET | `/api/policies/viewed/` | 최근 20건 |

정책 검색 시 검색어는 `SearchHistory`에 자동 기록되며, 정책 상세 조회 시 해당 정책은 `ViewedPolicy`에 자동 기록된다.

### 4.3 마이페이지 API

| 기능 | Method | URL |
|---|---|---|
| 마이페이지 요약 조회 | GET | `/api/mypage/` |

마이페이지는 별도의 데이터 모델을 갖지 않으며, 사용자 프로필·정책 활동·알림 데이터를 취합하여 요약 정보를 반환하는 라우팅 구조로 구현되었다.

---

## 5. 커뮤니티 API

| 기능 | Method | URL |
|---|---|---|
| 게시글 목록 조회 | GET | `/api/community/posts/` |
| 게시글 작성 | POST | `/api/community/posts/` |
| 게시글 상세 조회 | GET | `/api/community/posts/{post_id}/` |
| 게시글 수정 | PATCH | `/api/community/posts/{post_id}/` |
| 게시글 삭제 | DELETE | `/api/community/posts/{post_id}/` |

작성자 본인 여부를 판단하는 `IsAuthorOrReadOnly` 권한 클래스를 통해 수정·삭제 권한을 제어한다.

---

## 6. 프로필 이미지 업로드 API (AWS S3)

| 기능 | Method | URL |
|---|---|---|
| 프로필 이미지 업로드 | POST | `/api/uploads/profile-image/` |
| 프로필 이미지 삭제 | DELETE | `/api/uploads/profile-image/` |

### 6.1 업로드 검증 기준

| 항목 | 기준 |
|---|---|
| 인증 | 로그인 사용자만 업로드 가능 |
| 파일 형식 | jpg, jpeg, png, webp |
| 파일 크기 | 5MB 이하 |

### 6.2 처리 방식

업로드된 파일은 AWS S3에 저장되며, 업로드 성공 시 반환된 URL이 `UserProfile.profile_image_url`에 저장된다. 기존 이미지가 있는 경우 신규 업로드 전 기존 파일을 S3에서 삭제한다.

### 6.3 응답 예시

```json
{
  "success": true,
  "data": {
    "profile_image_url": "https://example-bucket.s3.amazonaws.com/profile/user_1.png"
  },
  "message": "프로필 이미지가 업로드되었습니다.",
  "error": null
}
```

---

## 7. CORS 설정

React 프론트엔드와의 통신을 위해 `django-cors-headers`를 적용하였다.

| 설정 항목 | 값 |
|---|---|
| 허용 Origin | 환경변수(`CORS_ALLOWED_ORIGINS`)로 관리 |
| Credentials 허용 | 적용 |