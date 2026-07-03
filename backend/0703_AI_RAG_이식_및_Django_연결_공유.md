# AI/RAG 기능 이식 및 Django 연결 공유 문서

## 1. 문서 목적

본 문서는 3차 프로젝트에서 구현했던 RAG/LLM 기반 청년 지원 정보 추천 기능을 4차 React + Django 구조에 연결하기 위해 현재까지 정리된 작업 내용과, Django 코어 백엔드 담당자가 앞으로 연결해야 할 사항을 공유하기 위한 문서이다.

개인 디버깅 과정이나 로컬 테스트 이슈는 제외하고, 팀원이 알아야 하는 연동 기준만 정리한다.

---

## 2. 현재 AI/RAG 이식 방향

4차 프로젝트에서는 3차 RAG/LLM 코드를 새로 작성하지 않고, 기존 RAG 핵심 로직을 Django에서 호출할 수 있는 구조로 이식한다.

기본 방향은 다음과 같다.

```text
React
→ Django API
→ apps/chat_rag/services.py
→ rag_engine 내부 RAG workflow
→ answer / recommendations / sources / warnings / error 반환
```

역할 분리는 다음과 같이 본다.

| 영역 | 담당 |
|---|---|
| Django 프로젝트 구조, 인증, Policy 모델, 공통 API | 한경찬 |
| AI 챗봇 내부 로직, RAG 호출, 추천 결과 변환, LLM 예외 처리 | 윤승혁 |
| 정책 데이터 적재, 마감 갱신, AWS 배포 | 정승 |
| React 화면 호출 및 결과 표시 | 송민지 |

---

## 3. 현재 준비된 AI/RAG 구조

4차 백엔드에는 다음 구조로 이식하는 것을 기준으로 한다.

```text
backend/
├── apps/
│   └── chat_rag/
│       ├── services.py
│       ├── serializers.py
│       ├── views.py
│       └── urls.py
│
└── rag_engine/
    ├── graph/
    │   ├── workflow.py
    │   ├── nodes.py
    │   ├── graph_nodes.py
    │   └── prompts.py
    │
    ├── services/
    │   ├── rag_service.py
    │   ├── condition_extractor.py
    │   ├── policy_matcher.py
    │   ├── answer_generator.py
    │   ├── external_search_service.py
    │   └── hybrid_retriever.py
    │
    └── db/
        ├── vector_store.py
        ├── graph_service.py
        └── policy_repository.py
```

구조상 역할은 다음과 같다.

| 경로 | 역할 |
|---|---|
| `apps/chat_rag/` | Django API와 AI 서비스 연결부 |
| `apps/chat_rag/services.py` | Django에서 호출하는 AI 챗봇 서비스 진입점 |
| `rag_engine/` | 3차 RAG/LLM 핵심 로직 |
| `rag_engine/graph/workflow.py` | RAG workflow 실행 |
| `rag_engine/services/` | 조건 추출, 검색, 자격 판단, 답변 생성 |
| `rag_engine/db/` | Vector DB 및 보조 저장소 연결 |

---

## 4. AI 챗봇 API 연결 기준

Django에서 연결할 최종 엔드포인트는 다음을 기준으로 한다.

```text
POST /api/ai/chat/
```

요청 예시는 다음과 같다.

```json
{
  "message": "서울에 사는 25세 청년이 받을 수 있는 월세 지원 정책 알려줘",
  "user_profile": {
    "age": 25,
    "region": "서울",
    "interests": ["주거", "복지"]
  },
  "top_k": 5,
  "conversation_id": null
}
```

필드 의미는 다음과 같다.

| 필드 | 설명 |
|---|---|
| `message` | 사용자 자연어 질문 |
| `user_profile` | 로그인 사용자 또는 프론트에서 전달한 프로필 조건 |
| `top_k` | 추천 결과 개수 |
| `conversation_id` | 대화 식별자. MVP에서는 null 허용 |

---

## 5. AI 응답 형식

React 프론트엔드가 사용할 응답 구조는 다음을 기준으로 한다.

```json
{
  "answer": "질문에 대한 AI 답변",
  "recommendations": [
    {
      "policy_id": "policy_001",
      "item_id": "policy_001",
      "title": "청년월세지원",
      "policy_name": "청년월세지원",
      "source_category": "policy",
      "domain": "주거",
      "summary": "청년의 주거비 부담 완화를 위한 월세 지원 정책",
      "eligibility": "추가 확인 필요",
      "deadline_status": "unknown",
      "application_url": "https://example.com/apply",
      "source_url": "https://example.com/source",
      "needs_detail_check": true,
      "cautions": []
    }
  ],
  "sources": [
    {
      "title": "청년월세지원",
      "url": "https://example.com/source"
    }
  ],
  "warnings": [
    "실제 신청 가능 여부는 공식 원문에서 확인해야 합니다."
  ],
  "error": null,
  "meta": {
    "user_conditions": {
      "age": 25,
      "region": "서울",
      "income": null,
      "employment_status": null,
      "interest_domain": "주거"
    },
    "route": "주거",
    "route_reason": "질문과 조건을 기준으로 주거 분야로 분기",
    "internal_search_sufficient": false,
    "next_action": "external_search",
    "external_used": true
  }
}
```

프론트에서 우선 사용해야 하는 필드는 다음과 같다.

| 화면 요소 | 사용 필드 |
|---|---|
| 챗봇 답변 본문 | `answer` |
| 추천 카드 목록 | `recommendations` |
| 카드 제목 | `recommendations[].title` |
| 카드 요약 | `recommendations[].summary` |
| 신청 가능성 | `recommendations[].eligibility` |
| 마감 상태 | `recommendations[].deadline_status` |
| 신청 버튼 | `recommendations[].application_url` |
| 출처 버튼 | `recommendations[].source_url` |
| 경고 문구 | `warnings` |

`application_url`이 없으면 신청 버튼을 숨긴다.

`source_url`이 없으면 출처 버튼을 숨기거나 “원문 확인 필요”로 표시한다.

---

## 6. 현재 AI/RAG 동작 상태

현재 AI/RAG 서비스 함수는 Django API에 붙이기 전 단계에서 정상 호출 가능한 상태다.

확인된 동작은 다음과 같다.

```text
1. 기존 3차 RAG workflow 호출 가능
2. OpenAI API 기반 조건 추출 및 답변 생성 가능
3. Chroma Vector DB 연결 가능
4. 내부 Vector DB 검색 실행 가능
5. 내부 검색 결과가 부족하거나 부적절한 경우 외부 공식 출처 검색 fallback 가능
6. 최종 응답을 answer / recommendations / sources / warnings / error 구조로 변환 가능
7. route, tool_trace, external_used 등 디버깅 및 발표용 meta 정보 반환 가능
```

현재 RAG 흐름은 다음과 같다.

```text
사용자 질문
→ 조건 추출
→ route/source_category 판단
→ 내부 Vector DB 검색
→ 검색 충분성 판단
→ 충분하면 내부 결과 기반 답변 생성
→ 부족하면 공식 외부 출처 검색 fallback
→ 자격 가능성 판단
→ 최종 답변 및 추천 카드 반환
```

---

## 7. Django 코어 백엔드에서 연결해야 할 사항

한경찬 담당 영역에서 앞으로 연결해야 할 사항은 다음과 같다.

### 7.1 `chat_rag` 앱 등록

Django 백엔드에 다음 앱 구조를 추가한다.

```text
backend/apps/chat_rag/
├── views.py
├── serializers.py
├── services.py
└── urls.py
```

`apps/chat_rag/services.py`는 윤승혁이 작성한 AI 서비스 진입점으로 사용한다.

---

### 7.2 URL 연결

프로젝트 메인 `urls.py`에 다음 라우팅을 추가한다.

```python
from django.urls import include, path

urlpatterns = [
    path("api/ai/", include("apps.chat_rag.urls")),
]
```

`apps/chat_rag/urls.py`는 다음 구조를 기준으로 한다.

```python
from django.urls import path
from .views import AIChatAPIView

urlpatterns = [
    path("chat/", AIChatAPIView.as_view(), name="chat"),
]
```

최종 호출 주소는 다음과 같다.

```text
POST /api/ai/chat/
```

---

### 7.3 Serializer 연결

요청 검증용 serializer는 다음 필드를 받는다.

```text
message
user_profile
top_k
conversation_id
```

MVP 기준으로 `message`만 필수이며, `user_profile`, `top_k`, `conversation_id`는 선택값으로 처리한다.

---

### 7.4 View 연결

Django view는 긴 AI 로직을 직접 처리하지 않고, serializer 검증 후 `run_ai_chat()`만 호출한다.

```python
result = run_ai_chat(
    message=data["message"],
    user_profile=data.get("user_profile"),
    top_k=data.get("top_k", 5),
    conversation_id=data.get("conversation_id"),
)
```

View의 역할은 다음으로 제한한다.

```text
1. 요청 수신
2. serializer 검증
3. run_ai_chat() 호출
4. Response 반환
```

---

### 7.5 공통 응답 형식 적용 여부 결정

한경찬이 공통 API 응답 형식을 다음처럼 잡는 경우가 있다.

```json
{
  "success": true,
  "data": {},
  "message": "요청이 성공적으로 처리되었습니다.",
  "error": null
}
```

이 형식을 AI API에도 적용할지 결정이 필요하다.

#### A안: AI API는 원형 그대로 반환

```json
{
  "answer": "...",
  "recommendations": [],
  "sources": [],
  "warnings": [],
  "error": null
}
```

장점: React 챗봇 화면에서 바로 사용하기 쉽다.

#### B안: 공통 응답으로 감싸서 반환

```json
{
  "success": true,
  "data": {
    "answer": "...",
    "recommendations": [],
    "sources": [],
    "warnings": [],
    "error": null
  },
  "message": "AI 응답 생성 성공",
  "error": null
}
```

장점: 전체 백엔드 API 응답 형식과 통일된다.

프론트 구현 편의성을 고려하면 A안이 단순하지만, 백엔드 전체 규칙을 중시하면 B안으로 맞출 수 있다.

---

### 7.6 인증 적용 여부 결정

`/api/ai/chat/`을 로그인 필수로 할지 선택해야 한다.

MVP 기준 권장안은 다음과 같다.

```text
비로그인 사용자도 질문 가능
로그인 사용자는 UserProfile을 자동 반영
```

다만 개인화 추천, 검색 기록 저장, 마이페이지 연동을 고려하면 로그인 사용자의 경우 다음 정보를 활용할 수 있다.

```text
UserProfile.age
UserProfile.region
UserProfile.interests
SearchHistory
Scrap
ViewedPolicy
```

---

### 7.7 Policy 모델과의 연결

초기 이식 단계에서는 기존 Chroma Vector DB와 JSON 기반 RAG 검색을 유지한다.

이후 Django `Policy` 모델이 준비되면 다음 항목을 연결할 수 있다.

```text
1. 추천 결과의 item_id로 Policy 모델 상세 정보 보강
2. 정책 상세 페이지 이동
3. 스크랩 기능 연결
4. 최근 본 공고 저장
5. 마이페이지 추천 요약 연결
```

초기에는 AI API가 반드시 ORM에 의존하지 않도록 유지한다.

---

## 8. 환경변수 및 데이터 경로

AI/RAG 기능 실행을 위해 필요한 환경변수는 다음과 같다.

```env
OPENAI_API_KEY=
CHROMA_PERSIST_DIR=
CHROMA_COLLECTION_NAME=youth_opportunity_chunks
TAVILY_API_KEY=
```

권장 경로 예시는 다음과 같다.

```env
CHROMA_PERSIST_DIR=C:\SKN projects\mini4\data\vector_db
CHROMA_COLLECTION_NAME=youth_opportunity_chunks
```

데이터 기준은 다음과 같다.

| 항목 | 기준 |
|---|---|
| Vector DB 경로 | `data/vector_db` |
| Collection name | `youth_opportunity_chunks` |
| 통합 데이터 | `data/processed/opportunities.json` |
| RAG 청크 | `data/processed/opportunity_chunks.jsonl` |

---

## 9. 예외 처리 기준

AI API는 다음 상황에서도 응답 구조를 유지해야 한다.

| 상황 | 처리 |
|---|---|
| 질문이 비어 있음 | `error` 또는 400 응답 |
| 내부 검색 결과 없음 | `recommendations=[]`, `warnings` 제공 |
| LLM API 실패 | fallback answer와 warning 반환 |
| LLM timeout | timeout warning 또는 error 반환 |
| source_url 없음 | 원문 확인 필요 warning |
| application_url 없음 | 신청 버튼 숨김 |
| 마감 정책만 검색됨 | 신청 가능 정책처럼 안내하지 않음 |
| 비현실적 질문 | 정책을 임의 생성하지 않음 |

AI 응답은 원본에 없는 신청 자격, 금액, 신청 기간을 임의 생성하지 않는다.

---

## 10. 한경찬에게 요청할 작업 요약

한경찬이 앞으로 처리해야 하는 연결 작업은 다음과 같다.

```text
1. Django 프로젝트 기본 구조 생성
2. apps/chat_rag 앱 생성 또는 등록
3. /api/ai/chat/ URL 연결
4. AIChatRequestSerializer 연결
5. AIChatAPIView에서 run_ai_chat() 호출
6. 공통 응답 형식 적용 여부 결정
7. /api/ai/chat/ 인증 적용 여부 결정
8. UserProfile이 있는 경우 user_profile을 AI API로 전달하는 방식 결정
9. Policy 모델 준비 후 item_id 기반 상세/스크랩/최근 본 공고와 연결
10. React에서 CORS 문제 없이 호출 가능하도록 설정
```

---

## 11. 송민지에게 공유할 프론트 연동 기준

React에서는 다음 주소로 요청한다.

```text
POST /api/ai/chat/
```

최소 요청은 다음과 같다.

```json
{
  "message": "월세 지원 정책 알려줘",
  "top_k": 5
}
```

로그인 사용자 프로필이 있으면 다음처럼 함께 보낸다.

```json
{
  "message": "월세 지원 정책 알려줘",
  "user_profile": {
    "age": 25,
    "region": "서울",
    "interests": ["주거"]
  },
  "top_k": 5
}
```

화면에서는 다음 필드를 우선 사용한다.

```text
answer
recommendations[].title
recommendations[].summary
recommendations[].eligibility
recommendations[].deadline_status
recommendations[].application_url
recommendations[].source_url
warnings
```

---

## 12. 현재 결론

현재 AI/RAG 기능은 Django API에 연결할 수 있는 서비스 함수 형태로 분리되어 있다.

다음 단계는 Django 코어 백엔드 구조가 준비되는 대로 `/api/ai/chat/`에 연결하고, React에서 동일한 응답 형식을 기준으로 챗봇 UI를 붙이는 것이다.
