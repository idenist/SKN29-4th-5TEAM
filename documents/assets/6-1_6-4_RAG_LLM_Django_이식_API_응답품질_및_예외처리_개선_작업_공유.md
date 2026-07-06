# 6-1~6-4. RAG/LLM Django 이식 및 AI 챗봇 API 개선 작업 공유

## 작업 목적

기존 RAG/LLM 기반 청년 지원 정보 추천 로직을 4차 프로젝트의 Django 백엔드 구조에 맞게 이식하고, 프론트엔드에서 호출 가능한 `/api/ai/chat/` API로 안정화하는 것을 목표로 했다.

## 6-1. Django 구조 이식

- 기존 RAG/LLM 로직을 Django 프로젝트 구조에 맞게 분리했다.
  - `apps/chat_rag/` : AI 챗봇 API 요청/응답 처리
  - `rag_engine/` : 검색, 라우팅, 답변 생성, fallback 등 RAG 핵심 로직
- `/api/ai/chat/` 엔드포인트를 통해 AI 챗봇 기능을 호출할 수 있도록 연결했다.
- View에서는 요청 검증과 응답 반환을 담당하고, 실제 AI 처리 로직은 Service 계층으로 위임하도록 구성했다.
- 응답 형식은 백엔드 공통 구조인 `success / data / message / error` 형태에 맞췄다.
- Django 실행 환경에서 Chroma Vector DB와 기존 RAG workflow가 호출되는 것을 확인했다.
- 내부 검색 결과가 부족한 경우 공식 외부 출처 검색으로 fallback되는 흐름을 확인했다.

## 6-2. AI 챗봇 API 입력 처리 및 내부 검색 안정화

- `/api/ai/chat/` 요청에서 `message`, `user_profile`, `top_k` 값을 받아 RAG workflow에 전달하도록 구성했다.
- 사용자 프로필의 `age`, `region`, `interests` 값을 정규화하여 응답 `meta.user_conditions`에 반영했다.
- `region=서울` 입력을 `region_code=11000`으로 변환하여 검색 조건에 활용할 수 있도록 했다.
- 내부 Vector DB 검색이 Django 환경에서 정상 수행되도록 `vector_store.py`의 검색 흐름을 보완했다.
- 정책 질문에서 데이터 유형이 섞이는 문제를 줄이기 위해 `source_category` 기반 검색 흐름을 개선했다.
- 월세/주거 질문 기준으로 내부 Vector DB 검색 결과가 반환되고, 충분성 검사 통과 후 내부 DB 기반 답변이 생성되는 것을 확인했다.

## 6-3. AI 응답 품질 및 프론트 카드 응답 구조 개선

- 내부 검색 결과 중 사용자 관심 분야와 직접 관련 있는 후보를 우선 추천하도록 정렬/필터링 로직을 개선했다.
- 월세/주거 질문에서 주거 관련 정책 중심으로 추천 결과가 정리되도록 하여, 관련성이 낮은 후보가 함께 노출되는 문제를 줄였다.
- LLM 답변이 과도하게 길어지거나 중간에 끊기지 않도록 프롬프트 입력 데이터와 답변 형식을 조정했다.
- 프론트엔드 카드에서 바로 사용할 수 있도록 `display_summary`, `display_period`, `display_action_text`, `badges`, `action_url`, `has_detail_url` 필드를 추가했다.
- 추천 카드에 표시되는 요약, 신청기간, 상세보기 URL, 확인 필요 상태가 안정적으로 반환되는 것을 확인했다.

## 6-4. 예외 처리 및 실패 응답 안정화

- 요청 검증 단계에서 빈 질문, 잘못된 `top_k` 값 등을 일관된 에러 응답으로 반환하도록 정리했다.
- 프론트엔드가 에러 상황을 쉽게 분기할 수 있도록 `EMPTY_MESSAGE`, `INVALID_TOP_K`, `INVALID_USER_PROFILE` 등 에러 코드를 추가했다.
- 실패 응답에도 `success`, `data`, `message`, `error` 구조를 유지하도록 맞췄다.
- `data.meta.error_code`, `data.meta.fallback_used` 값을 통해 프론트에서 fallback 여부를 확인할 수 있게 했다.
- 내부 검색 결과가 부족한 경우 서비스가 중단되지 않고 공식 외부 출처 검색으로 fallback되는 흐름을 확인했다.

## API 확인 결과

`POST /api/ai/chat/` 요청을 통해 다음 항목들이 정상적으로 반환되는 것을 확인했다.

- `answer` : 사용자 질문에 대한 AI 답변
- `recommendations` : 추천 정책 목록 및 프론트 카드 표시용 필드
- `sources` : 응답에 사용된 출처 URL
- `warnings` : 추가 확인이 필요한 조건 안내
- `meta` : 사용자 조건, 라우팅 결과, 검색 흐름 등 확인용 정보

서울 거주 25세 청년의 월세 지원 질문 테스트에서 다음 흐름을 확인했다.

- 내부 Vector DB 검색 결과 반환
- `internal_search_sufficient: true`
- `external_used: false`
- 외부 검색 fallback 없이 내부 DB 기반 답변 생성
- 추천 결과에 `(국토부) 26년 청년월세 지원사업`, `청년월세 한시 특별지원`, `청년안심주택 공급활성화` 등 주거 관련 정책 포함
- 프론트 카드용 `display_summary`, `display_period`, `badges`, `action_url`, `has_detail_url` 필드 반환 확인

요청 검증 테스트에서는 다음 흐름을 확인했다.

- 빈 `message` 요청 시 `EMPTY_MESSAGE` 반환
- `top_k`가 허용 범위를 벗어난 경우 `INVALID_TOP_K` 반환
- 정상 요청에서는 기존 AI 응답 구조와 추천 카드 필드가 유지됨
- 내부 검색 결과가 부족한 경우 외부 공식 출처 검색 fallback 동작 확인

## 현재 상태

6-1의 **기존 RAG/LLM 기능 Django 구조 이식**, 6-2의 **AI 챗봇 API 입력 처리 및 내부 검색 안정화**, 6-3의 **응답 품질 및 프론트 카드 응답 구조 개선**, 6-4의 **예외 처리 및 실패 응답 안정화**는 1차 완료된 상태다.

현재 `/api/ai/chat/` API는 사용자 프로필을 반영해 내부 Vector DB 검색을 수행하고, 검색 결과가 충분한 경우 내부 데이터 기반 답변과 프론트 카드용 추천 정보를 함께 반환한다. 요청 형식이 올바르지 않거나 내부 검색 결과가 부족한 경우에도 프론트엔드에서 처리 가능한 응답 구조를 유지한다.

## 후속 작업

- 프론트엔드와 실제 연동 후 화면 기준 응답 확인
- 추천 카드 UI에서 표시할 필드명과 노출 우선순위 최종 조율
- 배포 환경에서 Vector DB, OpenAI, 외부 검색 환경변수 점검
- 운영 환경 기준 로그 및 모니터링 항목 정리
