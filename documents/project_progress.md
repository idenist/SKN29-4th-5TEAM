# 프로젝트 진행 현황

작성일: 2026-07-06

이 문서는 현재 코드 기준의 개발 진행 기록입니다. 현재 구현 범위, API 연동 상태, 남은 작업을 빠르게 파악하기 위한 현황 문서입니다.

---

# 프로젝트 구조

```text
SKN29-4th-5TEAM/
├─ backend/
│  ├─ apps/
│  │  ├─ chat_rag/
│  │  ├─ common/
│  │  ├─ community/
│  │  ├─ mypage/
│  │  ├─ news/
│  │  ├─ notifications/
│  │  ├─ policies/
│  │  ├─ recommendations/
│  │  ├─ uploads/
│  │  └─ users/
│  ├─ config/
│  ├─ data_pipeline/
│  ├─ rag_engine/
│  ├─ tests/
│  ├─ manage.py
│  └─ requirements.txt
├─ data/
├─ deployment/
├─ documents/
│  ├─ 1_요구사항정의서.md
│  ├─ 2_화면설계서.md
│  ├─ 3_시스템구성도.md
│  ├─ 4_테스트계획_및_결과보고서.md
│  └─ project_progress.md
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  │  ├─ auth/
│  │  │  ├─ chat/
│  │  │  ├─ common/
│  │  │  ├─ community/
│  │  │  ├─ home/
│  │  │  ├─ layout/
│  │  │  ├─ mypage/
│  │  │  ├─ news/
│  │  │  ├─ notification/
│  │  │  ├─ policy/
│  │  │  └─ video/
│  │  ├─ hooks/
│  │  ├─ layouts/
│  │  ├─ pages/
│  │  ├─ services/
│  │  │  └─ adapters/
│  │  └─ styles/
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.js
├─ nginx/
├─ scripts/
├─ docker-compose.yml
├─ README.md
└─ requirements.txt
```

---

# 기술 스택

| 구분 | 기술 | 현재 코드 기준 상태 |
|---|---|---|
| Frontend | React 18, Vite 6 | `frontend`에 React/Vite 앱 구성 완료 |
| Frontend Routing | React Router DOM | `createBrowserRouter` 기반 라우팅 구성 |
| Frontend API | Axios | `apiClient` 및 도메인별 service 구성 |
| Frontend UI | CSS, lucide-react | 토큰/전역/페이지별 CSS와 lucide 아이콘 사용 |
| Backend | Django, Django REST Framework | `backend/apps` 단위 API 구성 |
| Auth | SimpleJWT | login, refresh, me, profile endpoint 존재 |
| Database | PostgreSQL 설정 | `backend/config/settings.py` 기준 PostgreSQL 사용 |
| AI/RAG | LangGraph, ChromaDB, OpenAI 등 | `chat_rag`, `rag_engine` 코드 존재 |
| Upload | S3 업로드 구조 | `apps/uploads`에서 boto3/S3 기반 업로드 구현 |
| Infra | Docker, nginx, gunicorn | 파일/설정 존재 |
| Tools | npm, conda/Python | frontend는 npm, backend는 `skn` Python 환경 사용 필요 |

---

# 현재 구현 완료 기능

## Home

| 항목 | 내용 |
|---|---|
| 페이지 | `/` |
| 구현 상태 | UI 구현 완료 |
| API 연동 | 없음, 페이지 내부 mock data 사용 |
| 주요 컴포넌트 | `HeroSection`, `QuickMenu`, `HomeStats`, `PolicyPreviewList`, `NewsPreviewList` |

구현 내용:

- 서비스 첫 화면 구성
- 정책 검색, AI 챗봇, 커뮤니티, 마이페이지, 뉴스/영상으로 이동하는 quick menu 제공
- mock 정책 미리보기, mock 뉴스 미리보기, mock 통계 표시

## Login

| 항목 | 내용 |
|---|---|
| 페이지 | `/login` |
| 구현 상태 | 실제 Auth API 연결 완료 |
| 사용 API | `POST /api/auth/login/` |
| 주요 파일 | `LoginPage.jsx`, `useAuth.js`, `authApi.js` |

구현 내용:

- 이메일/비밀번호 validation
- `authApi.login({ email, password })` 호출
- 로그인 성공 시 `accessToken`, `refreshToken`을 `localStorage`에 저장
- 로그인 성공 후 `/mypage`로 이동
- 실패 시 backend wrapper message/error 기반 form error 표시

## Signup

| 항목 | 내용 |
|---|---|
| 페이지 | `/signup` |
| 구현 상태 | 실제 Auth API 연결 완료 |
| 사용 API | `POST /api/auth/signup/` |
| 주요 파일 | `SignupPage.jsx`, `authApi.js` |

구현 내용:

- 이메일, 비밀번호, 비밀번호 확인, 이름/닉네임, 생년월일, 지역, 관심 분야 validation
- backend serializer에 맞춰 `email`, `username`, `password`, `password_confirm`만 전송
- `username`은 nickname 우선, 없으면 email 앞부분 사용
- 가입 성공 후 `/login`으로 이동
- 이름/지역/관심 분야는 현재 signup API에는 전송하지 않음

## Policy Search

| 항목 | 내용 |
|---|---|
| 페이지 | `/policies` |
| 구현 상태 | 실제 Policy API 연결 완료 |
| 사용 API | `GET /api/policies/` |
| 주요 파일 | `PolicySearchPage.jsx`, `usePolicies.js`, `policyApi.js`, `policyAdapter.js` |

구현 내용:

- mock 정책 배열 제거
- 최초 진입 시 정책 목록 조회
- 검색어는 backend query `keyword`로 전송
- 지역 필터는 backend query `region`으로 전송
- 분야 필터는 backend query `source_category`로 전송
- 상태/소득조건은 adapter 결과를 기준으로 프론트에서 보조 필터링
- 목록 loading, error, empty 처리
- 페이지네이션 유지

## Policy Detail

| 항목 | 내용 |
|---|---|
| 페이지 | `/policies/:itemId` |
| 구현 상태 | 실제 Policy Detail API 연결 완료 |
| 사용 API | `GET /api/policies/:itemId/`, `POST /api/policies/scraps/`, `DELETE /api/policies/scraps/:itemId/` |
| 주요 파일 | `PolicyDetailPage.jsx`, `ScrapButton.jsx`, `usePolicies.js`, `policyApi.js` |

구현 내용:

- mock 상세 정책 배열 제거
- `itemId`를 route param에서 읽어 실제 상세 API 호출
- 상세 본문, 신청 대상, 신청 방법, 필요 서류, 신청 CTA 표시
- 잘못된 `itemId`는 `ErrorState`로 처리
- 로그인 상태에서 스크랩 생성/삭제 API 호출
- 비로그인 상태에서는 "로그인이 필요한 기능입니다." 안내
- 스크랩 실패 시 optimistic UI rollback 처리

## Chat

| 항목 | 내용 |
|---|---|
| 페이지 | `/chat` |
| 구현 상태 | 실제 AI Chat API 연결 완료 |
| 사용 API | `POST /api/ai/chat/` |
| 주요 파일 | `ChatPage.jsx`, `useChat.js`, `chatApi.js`, `chatAdapter.js` |

구현 내용:

- mock AI delay 응답 제거
- 사용자 메시지는 즉시 추가
- `chatApi.sendChatMessage()`로 실제 API 호출
- 기본 `top_k`는 3
- 로그인 사용자 profile이 있으면 `user_profile`에 age, region, interests 전달
- backend `answer`를 AI 메시지로 표시
- backend `recommendations`를 `RecommendedPolicyList`에 표시
- 요청 중 `TypingIndicator` 표시
- 실패 시 사용자 메시지는 유지하고 AI 에러 메시지와 `ErrorState` 표시

## Community

| 항목 | 내용 |
|---|---|
| 페이지 | `/community`, `/community/:postId` |
| 구현 상태 | 실제 Community API 연결 완료 |
| 사용 API | `GET/POST /api/community/posts/`, `GET/PATCH/DELETE /api/community/posts/:postId/` |
| 주요 파일 | `CommunityPage.jsx`, `CommunityDetailPage.jsx`, `useCommunity.js`, `communityApi.js`, `communityAdapter.js` |

구현 내용:

- mock 게시글 배열 제거
- 목록 조회 API 연결
- 상세 조회 API 연결
- 검색은 프론트에서 title, summary, content, tags fallback 기준으로 처리
- backend에 category/tags/likes/commentsCount가 없어 adapter fallback 적용
- 글쓰기 modal에서 로그인 상태면 `title`, `content`만 전송
- 비로그인 글쓰기/수정/삭제는 안내 메시지 표시
- 수정 API 호출 구조 연결
- 삭제 성공 시 `/community`로 이동
- 목록/상세 loading, error, empty 처리

## Notification

| 항목 | 내용 |
|---|---|
| 페이지 | `/notifications` |
| 구현 상태 | 실제 Notification API 연결 완료 |
| 사용 API | `GET /api/notifications/`, `PATCH /api/notifications/:id/read/`, `DELETE /api/notifications/:id/` |
| 주요 파일 | `NotificationPage.jsx`, `useNotifications.js`, `notificationApi.js`, `notificationAdapter.js` |

구현 내용:

- mock 알림 데이터 제거
- 알림 목록 API 연결
- 전체/안읽음/읽음 필터 유지
- 개별 읽음 처리 API 연결
- 개별 삭제 API 연결
- 모두 읽음 처리 구현
- 읽음/삭제는 optimistic update 후 실패 시 rollback
- 비로그인 시 API 호출하지 않고 안내 표시
- loading, error, empty 처리

## MyPage

| 항목 | 내용 |
|---|---|
| 페이지 | `/mypage` |
| 구현 상태 | 실제 MyPage API 연결 완료 |
| 사용 API | `/api/mypage/`, `/api/mypage/profile/`, `/api/mypage/scraps/`, `/api/mypage/viewed-policies/`, `/api/mypage/search-history/`, `/api/mypage/notifications/` |
| 주요 파일 | `MyPage.jsx`, `useMyPage.js`, `mypageApi.js`, `mypageAdapter.js` |

구현 내용:

- `myPageMock` 제거
- 프로필, 요약 통계, 스크랩 정책, 최근 본 정책, 검색 기록, 알림 미리보기 API 연결
- 정책 항목 클릭 시 `/policies/:itemId` 이동
- 알림 미리보기 클릭 시 `/notifications` 이동
- 비로그인 시 API 호출하지 않고 안내 표시
- loading, error, empty 처리

## Profile Edit

| 항목 | 내용 |
|---|---|
| 페이지 | `/mypage/profile` |
| 구현 상태 | 실제 Profile/Upload API 연결 완료 |
| 사용 API | `GET /api/mypage/profile/`, `PATCH /api/mypage/profile/update/`, `POST/DELETE /api/uploads/profile-image/` |
| 주요 파일 | `ProfileEditPage.jsx`, `ProfileEditForm.jsx`, `useProfile.js`, `mypageApi.js`, `uploadApi.js` |

구현 내용:

- mock profile 제거
- 현재 프로필 조회
- age, region, interests 수정 API 연결
- 프로필 이미지 업로드 API 연결
- 프로필 이미지 삭제 API 연결
- 저장/업로드/삭제 성공 및 실패 메시지 표시
- backend profile update API에서 이름/닉네임 수정이 지원되지 않아 해당 입력은 disabled 처리
- birthDate 대신 backend 기준에 맞춰 age 입력 사용

## News

| 항목 | 내용 |
|---|---|
| 페이지 | `/news` |
| 구현 상태 | UI 구현 완료, mock data 유지 |
| API 연동 | 미연동 |
| 주요 파일 | `NewsPage.jsx`, `newsMock.js`, `newsApi.js` |

구현 내용:

- mock 뉴스 목록 표시
- 카테고리 필터
- 검색어 필터
- 외부 링크 버튼 구조
- backend `apps/news/urls.py`에 URL pattern이 아직 없어 `newsApi.getNews()`는 not implemented error를 던지는 구조

## Video

| 항목 | 내용 |
|---|---|
| 페이지 | `/videos` |
| 구현 상태 | UI 구현 완료, mock data 유지 |
| API 연동 | 미연동 |
| 주요 파일 | `VideoPage.jsx`, `videoMock.js`, `newsApi.js` |

구현 내용:

- mock 영상 목록 grid 표시
- 카테고리 필터
- 검색어 필터
- 썸네일 mock 영역
- 외부 영상 보기 버튼 구조
- backend `apps/recommendations/urls.py`에 URL pattern이 아직 없어 `newsApi.getRecommendations()`는 not implemented error를 던지는 구조

## Layout / Navigation

| 항목 | 내용 |
|---|---|
| 구현 상태 | 공통 레이아웃 구현 완료 |
| 주요 컴포넌트 | `RootLayout`, `AuthLayout`, `Header`, `Footer`, `GlobalNav`, `UserMenu` |

구현 내용:

- Header + main + Footer 구조
- 주요 메뉴: 홈, 정책검색, AI챗봇, 커뮤니티, 뉴스, 영상
- 로그인 상태에 따라 `UserMenu`에서 로그인/회원가입 또는 알림/마이페이지/로그아웃 표시
- `ProtectedRoute` 컴포넌트는 존재하지만 현재 실제 차단 로직 없이 children 또는 Outlet을 통과시킴

---

# API 연동 현황

| Page | API | Status | 비고 |
|---|---|---|---|
| Home | 없음 | Mock | 페이지 내부 mock data 사용 |
| Login | `POST /api/auth/login/` | 연결 완료 | access/refresh token localStorage 저장 |
| Signup | `POST /api/auth/signup/` | 연결 완료 | username/password_confirm 형식으로 전송 |
| PolicySearch | `GET /api/policies/` | 연결 완료 | keyword, region, source_category query 사용 |
| PolicyDetail | `GET /api/policies/:itemId/` | 연결 완료 | adapter로 상세 UI shape 변환 |
| Policy Scrap | `POST /api/policies/scraps/`, `DELETE /api/policies/scraps/:itemId/` | 연결 완료 | 로그인 필요 |
| Chat | `POST /api/ai/chat/` | 연결 완료 | recommendations를 추천 정책 카드로 표시 |
| Community | `GET/POST /api/community/posts/` | 연결 완료 | backend에 없는 필드는 fallback |
| Community Detail | `GET/PATCH/DELETE /api/community/posts/:postId/` | 연결 완료 | 수정/삭제는 로그인 필요 |
| Notification | `GET /api/notifications/` | 연결 완료 | 로그인 필요 |
| Notification Read | `PATCH /api/notifications/:id/read/` | 연결 완료 | optimistic update |
| Notification Delete | `DELETE /api/notifications/:id/` | 연결 완료 | optimistic update |
| MyPage | `GET /api/mypage/` 외 mypage 하위 API | 연결 완료 | summary와 개별 목록 API 함께 사용 |
| ProfileEdit | `GET/PATCH /api/mypage/profile...` | 연결 완료 | age, region, interests 수정 |
| Upload | `POST/DELETE /api/uploads/profile-image/` | 연결 완료 | multipart 업로드 |
| News | `/api/news/` | 미연동 | backend URL pattern TODO |
| Video | `/api/recommendations/` | 미연동 | backend URL pattern TODO |

---

# 현재 구현된 공통 컴포넌트

| 분류 | 컴포넌트 | 역할 |
|---|---|---|
| Common | `Button` | variant, size, icon, fullWidth 지원 버튼 |
| Common | `Input` | label, error, 접근성 속성을 포함한 입력 |
| Common | `Select` | option 기반 선택 입력 |
| Common | `Modal` | 공통 modal wrapper |
| Common | `Spinner` | loading 상태 표시 |
| Common | `EmptyState` | 빈 결과/빈 데이터 표시 |
| Common | `ErrorState` | 에러 메시지와 재시도 버튼 표시 |
| Common | `PageHeader` | 페이지 상단 제목/설명/action |
| Common | `Card` | 일반/interactive 카드 |
| Common | `Badge` | 상태/분류 표시 |
| Common | `Tabs` | 탭 UI |
| Common | `Pagination` | 페이지 번호 이동 |
| Common | `SearchBar` | 검색 입력과 submit |
| Layout | `Header` | 상단 레이아웃 |
| Layout | `Footer` | 하단 레이아웃 |
| Layout | `GlobalNav` | 주요 메뉴 navigation |
| Layout | `UserMenu` | 로그인 상태별 사용자 메뉴 |
| Layout | `PageContainer` | 페이지 폭 제한 wrapper |
| Layout | `Section` | 섹션 wrapper |
| Layout | `Toolbar` | 필터/검색 toolbar |
| Layout | `FormLayout` | 폼 layout wrapper |
| Layout | `ProtectedRoute` | 현재는 pass-through, 실제 인증 차단 미구현 |

---

# Hooks

| Hook | 역할 | 사용 영역 |
|---|---|---|
| `useAuth` | access/refresh token 저장/삭제, 로그인 상태, `getMe` 호출 | Auth, UserMenu, 인증 필요 화면 |
| `usePolicies` | 정책 목록/상세 조회, 스크랩 토글 | PolicySearch, PolicyDetail |
| `useChat` | 채팅 메시지, 추천 정책, loading/error, conversationId 관리 | Chat |
| `useCommunity` | 게시글 목록/상세/작성/수정/삭제 관리 | Community |
| `useNotifications` | 알림 목록, 읽음 처리, 삭제, 필터 count 관리 | Notification |
| `useMyPage` | 마이페이지 요약/스크랩/최근 본 정책/검색 기록/알림 조회 | MyPage |
| `useProfile` | 프로필 조회/수정, 이미지 업로드/삭제 | ProfileEdit |
| `useTimeoutFetch` | 파일은 존재하나 현재 주요 페이지 연결 여부는 확인되지 않음 | 보조 hook |

---

# Services

| Service | 역할 |
|---|---|
| `apiClient` | Axios instance, baseURL, Bearer token 첨부, DRF wrapper unwrap |
| `authApi` | signup, login, refreshToken, getMe, updateProfile |
| `policyApi` | 정책 목록/상세, 스크랩, 검색 기록, 최근 본 정책 |
| `chatApi` | AI chat 요청 |
| `communityApi` | 커뮤니티 목록/상세/작성/수정/삭제 |
| `notificationApi` | 알림 목록, 읽음 처리, 삭제 |
| `mypageApi` | 마이페이지 summary/profile/scraps/search/viewed/notifications |
| `uploadApi` | 프로필 이미지 업로드/삭제 |
| `newsApi` | news/recommendations API 미구현 상태를 명확히 error로 처리 |

---

# Adapter

| Adapter | 역할 |
|---|---|
| `policyAdapter` | backend Policy/ Scrap/ SearchHistory/ ViewedPolicy 응답을 UI 정책 카드/상세 shape로 변환 |
| `chatAdapter` | AI chat 응답의 recommendations를 추천 정책 카드 shape로 변환 |
| `communityAdapter` | CommunityPost 목록/상세 응답을 UI 게시글 shape로 변환 |
| `notificationAdapter` | notification_type, is_read, created_at 등을 type, isRead, createdAt, link로 변환 |
| `mypageAdapter` | profile, summary, scraps, viewed, search, notification 응답을 MyPage UI shape로 변환 |

---

# 현재 구현된 주요 기능

- [x] React/Vite frontend 초기화
- [x] React Router 라우팅 구성
- [x] 공통 Layout/Header/Footer/Nav 구성
- [x] 공통 UI 컴포넌트 구성
- [x] Axios apiClient 구성
- [x] DRF response wrapper unwrap 처리
- [x] 로그인 API 연결
- [x] 회원가입 API 연결
- [x] accessToken/refreshToken localStorage 저장
- [x] 로그아웃 시 token 삭제
- [x] 정책 목록 실제 API 조회
- [x] 정책 상세 실제 API 조회
- [x] 정책 스크랩 생성/삭제 API 연결
- [x] AI Chat 실제 API 연결
- [x] AI 추천 정책 표시
- [x] 커뮤니티 게시글 목록 실제 API 조회
- [x] 커뮤니티 게시글 상세 실제 API 조회
- [x] 커뮤니티 게시글 작성 API 연결
- [x] 커뮤니티 게시글 수정 API 연결
- [x] 커뮤니티 게시글 삭제 API 연결
- [x] 알림 목록 실제 API 조회
- [x] 알림 읽음 처리 API 연결
- [x] 알림 삭제 API 연결
- [x] 마이페이지 실제 API 조회
- [x] 프로필 조회/수정 API 연결
- [x] 프로필 이미지 업로드 API 연결
- [x] 프로필 이미지 삭제 API 연결
- [x] News UI mock 구현
- [x] Video UI mock 구현
- [x] Loading/Error/Empty 상태 처리

---

# 진행 중인 작업

현재 코드 기준으로 진행 중인 작업은 다음과 같습니다.

| 작업 | 현재 상태 |
|---|---|
| JWT 자동 refresh | `apiClient`에 TODO 주석만 존재, 미구현 |
| ProtectedRoute 실제 차단 | 컴포넌트는 있으나 pass-through 상태 |
| News API 연결 | backend URL pattern이 TODO라 mock 유지 |
| Video/Recommendations API 연결 | backend URL pattern이 TODO라 mock 유지 |
| backend 실행 환경 정리 | `skn` 환경에 `boto3/botocore`, `neo4j`, `tavily-python` 누락 확인 |

---

# 앞으로 구현 예정 기능

## High

- JWT 자동 refresh 구현
- `ProtectedRoute`에서 비로그인 사용자를 `/login`으로 redirect
- 인증 만료 시 logout 또는 refresh retry 처리
- backend `skn` 환경 누락 패키지 설치 및 `manage.py check` 통과 확인
- backend `.env` 구성 확인

## Medium

- News API backend URL pattern 구현 후 `NewsPage` 실제 API 연결
- Recommendations/Video API 구조 확정 후 `VideoPage` 실제 API 연결
- UI 문구 인코딩 깨짐 정리
- API 실패 메시지 일관화
- 테스트 계정 기준 실제 end-to-end 동작 확인

## Low

- 날짜 포맷 공통 유틸 분리
- 중복 Error message helper 정리
- 페이지별 mock data 파일 중 사용하지 않는 데이터 정리
- access token 저장 방식 보안 검토

---

# 개선 사항

| 영역 | 개선 내용 |
|---|---|
| 인증 | ProtectedRoute가 현재 실제 차단을 하지 않으므로 인증 라우팅 강화 필요 |
| 인증 | 401 발생 시 refresh token 자동 재발급 로직 필요 |
| 환경 | backend `skn` 환경에 `botocore/boto3`, `neo4j`, `tavily-python` 누락 |
| 환경 | `backend/.env`가 없어 DB/AWS/OpenAI 등 실제 실행 환경값 확인 필요 |
| UI 문구 | 일부 기존 파일에서 한글 인코딩이 깨져 보이는 문구가 남아 있음 |
| Adapter | backend에 없는 UI 필드가 fallback으로 채워지는 영역은 추후 backend 확장 시 재정리 필요 |
| API | News/Recommendations backend URL pattern이 TODO 상태 |
| 중복 | 여러 hook에서 `getErrorMessage` 유틸이 반복됨 |
| 테스트 | 프론트 build는 통과했으나 실제 backend 실행 기반 통합 테스트는 별도 필요 |

---

# 변경 이력

1. 기존 비어 있던 `frontend/package.json`, `src/App.jsx`, `src/main.jsx` 기반으로 React/Vite frontend 초기화
2. Vite 개발 서버 포트를 `localhost:3000` 기준으로 설정
3. React Router 기반 라우팅 구성
4. Axios 기반 `apiClient` 생성
5. reset/tokens/global/layout 등 CSS 구조 생성
6. 공통 UI 컴포넌트 생성: Button, Input, Select, Modal, Spinner, EmptyState, ErrorState, PageHeader, Card, Badge, Tabs, Pagination, SearchBar
7. 공통 Layout 컴포넌트 생성: Header, Footer, GlobalNav, UserMenu, PageContainer, Section, Toolbar, FormLayout, ProtectedRoute
8. HomePage UI를 mock data 기반으로 구현
9. PolicySearchPage mock UI 구현
10. PolicyDetailPage mock UI 구현
11. ChatPage mock UI 구현
12. LoginPage/SignupPage mock form 구현
13. CommunityPage/CommunityDetailPage mock UI 구현
14. MyPage/ProfileEditPage mock UI 구현
15. NotificationPage mock UI 구현
16. NewsPage/VideoPage mock UI 정리
17. backend API 구조 분석 및 request/response field 확인
18. service layer와 adapter 계층 구현
19. Login/Signup을 실제 Auth API에 연결
20. PolicySearch/PolicyDetail을 실제 Policy API에 연결
21. ChatPage를 실제 AI Chat API에 연결
22. CommunityPage/CommunityDetailPage를 실제 Community API에 연결
23. NotificationPage를 실제 Notification API에 연결
24. MyPage/ProfileEditPage를 실제 MyPage/Profile/Upload API에 연결
25. 기본 실행 환경 확인: frontend 의존성 설치 확인, backend `skn` 환경 누락 모듈 확인

---

# 현재 환경 확인 메모

| 항목 | 상태 |
|---|---|
| frontend `node_modules` | 존재 |
| frontend `.env.local` | 존재, `VITE_API_BASE_URL=http://127.0.0.1:8000/api` |
| backend `.env` | 없음 |
| 기본 Python | backend 핵심 모듈 다수 없음 |
| `skn` Python 환경 | Django/DRF/RAG 주요 모듈 대부분 있음 |
| `skn` 누락 모듈 | `boto3`, `botocore`, `neo4j`, `tavily-python` 계열 |
| backend `manage.py check` | `botocore` 누락으로 실패 |

