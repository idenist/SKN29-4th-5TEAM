# AI 챗봇 / RAG 연동 구현 문서 (Django 연결부)

**프로젝트**: 청년 정책 추천 웹 서비스 "이젠, 안쉼"
**담당**: Django Core Backend Lead
**문서 범위**: AI/RAG 기능의 Django API 연결 구조 및 검증 결과

---

## 1. 개요

AI 챗봇 기능은 RAG(Retrieval-Augmented Generation) 방식으로 동작하며, 자연어 질문에 대해 내부 정책 데이터베이스를 검색하여 근거 기반의 답변을 생성한다. AI 내부 로직(RAG 검색, LLM 호출, 추천 로직)은 별도 모듈로 구현되어 있으며, Django는 이 모듈을 API로 연결하는 역할을 담당한다.

본 시스템은 별도의 API 서버(FastAPI 등)를 사용하지 않으며, AI 로직은 Django 프로세스 내에서 Python 모듈로 직접 호출되는 구조로 구성되어 있다.

---

## 2. 시스템 구조

```
React
  ↓
Django API (/api/ai/chat/)
  ↓
apps/chat_rag/services.py (AI 서비스 진입점)
  ↓
rag_engine 내부 RAG workflow
  ↓
answer / recommendations / sources / warnings / error 반환
```

| 경로 | 역할 |
|---|---|
| `apps/chat_rag/` | Django API와 AI 서비스 연결부 |
| `rag_engine/graph/` | RAG workflow 실행 (조건 추출 → 검색 → 답변 생성) |
| `rag_engine/services/` | 조건 추출, 정책 매칭, 답변 생성, 외부 검색 |
| `rag_engine/db/` | 벡터 데이터베이스(ChromaDB) 및 저장소 연결 |

---

## 3. API 명세

### 3.1 엔드포인트

```
POST /api/ai/chat/
```

인증은 필수가 아니며(`AllowAny`), 로그인한 사용자의 경우 `UserProfile`(연령, 거주지, 관심분야)이 자동으로 요청에 반영된다. 프론트엔드에서 `user_profile`을 명시적으로 전달한 경우 해당 값이 우선 적용된다.

### 3.2 요청 형식

```json
{
  "message": "서울에 사는 25세 청년이 받을 수 있는 월세 지원 정책 알려줘",
  "user_profile": {
    "age": 25,
    "region": "서울",
    "interests": ["주거"]
  },
  "top_k": 5,
  "conversation_id": null
}
```

| 필드 | 필수 여부 | 설명 |
|---|---|---|
| `message` | 필수 | 사용자 자연어 질문 |
| `user_profile` | 선택 | 개인화 조건 (미전달 시 로그인 사용자 프로필로 자동 대체) |
| `top_k` | 선택 | 추천 결과 개수 (기본값 5) |
| `conversation_id` | 선택 | 대화 식별자 |

### 3.3 응답 형식

```json
{
  "answer": "질문에 대한 AI 답변",
  "recommendations": [
    {
      "title": "청년월세지원",
      "domain": "주거",
      "summary": "정책 요약",
      "eligibility": "신청 가능성 판단 결과",
      "deadline_status": "마감 상태",
      "application_url": "신청 URL",
      "source_url": "출처 URL"
    }
  ],
  "sources": [ { "title": "...", "url": "..." } ],
  "warnings": [ "원문 확인이 필요한 사항 안내" ],
  "error": null,
  "meta": {
    "route": "판단된 정책 도메인",
    "internal_search_sufficient": true,
    "external_used": false
  }
}
```

성공/실패 여부와 관계없이 위 응답 구조(`answer`, `recommendations`, `sources`, `warnings`, `error`, `meta`)는 항상 동일하게 유지되며, 프론트엔드는 하나의 파싱 로직으로 모든 응답 케이스를 처리할 수 있다.

---

## 4. RAG 동작 흐름

```
사용자 질문
→ 조건 추출 (연령, 지역, 관심분야)
→ 질문 의도에 따른 도메인/카테고리 판단
→ 내부 벡터 데이터베이스 검색
→ 검색 결과 충분성 판단
→ 충분한 경우: 내부 검색 결과 기반 답변 생성
→ 부족한 경우: 외부 공식 출처 검색으로 대체(fallback)
→ 신청 자격 가능성 및 유의사항 정리
→ 최종 답변 및 추천 카드 반환
```

---

## 5. 예외 처리 및 가드레일

| 상황 | 처리 |
|---|---|
| 요청 형식 오류 | HTTP 400, 오류 메시지 반환 |
| 내부 검색 결과 없음 | 빈 추천 목록과 안내 문구 반환 |
| 처리 중 서버 오류 발생 | HTTP 500, 동일한 응답 구조 유지하며 오류 안내 반환 |
| 출처 URL 없음 | 원문 확인 필요 안내 |
| 신청 URL 없음 | 신청 버튼 비노출 처리 |
| 마감된 정책 | 신청 가능한 정책으로 안내하지 않음 |
| 정보 불충분 | 원본에 없는 신청 자격, 금액, 기간을 임의로 생성하지 않음 |

---

## 6. 검증 결과

내부 벡터 데이터베이스(ChromaDB, `youth_opportunity_chunks` 컬렉션)는 33,950건의 정책 청크 데이터로 구성되어 있으며, 로컬 환경 및 Docker 컨테이너 환경 양쪽에서 정상 동작이 확인되었다.

실제 질의("서울에 사는 25세 청년이 받을 수 있는 월세 지원 정책 알려줘")에 대한 테스트 결과, 내부 데이터베이스 검색을 통해 관련 정책(청년월세 지원사업, 청년월세 한시 특별지원, 청년안심주택 등)이 정확히 검색되었으며, 검색 결과를 기반으로 한 자연어 답변이 정상적으로 생성됨을 확인하였다. 응답의 `meta.external_used` 값이 `false`로 확인되어, 외부 검색이 아닌 내부 데이터 기반 답변 생성 경로가 정상 동작함을 검증하였다.