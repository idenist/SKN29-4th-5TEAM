\# 마감임박 알림 기능 구현 문서



작성일: 2026-07-07

담당자: 정승

관련 WBS: 마감 임박 알림 쏴주는 기능



\---



\## 1. 기능 개요



로그인 사용자가 관심 정책으로 스크랩한 정책 중 마감임박 상태인 정책이 있으면 사용자별 알림을 생성한다.



프론트 팝업이나 실시간 푸시를 구현하는 것이 아니라, 백엔드에서 `Notification` 테이블에 알림 데이터를 생성하고 기존 알림 조회 API에서 확인할 수 있도록 하는 기능이다.



\---



\## 2. 기능 흐름



1\. 사용자가 정책을 관심 정책으로 스크랩한다.

2\. `Scrap` 테이블에 `user + policy` 정보가 저장된다.

3\. `generate\_deadline\_notifications` command를 실행한다.

4\. `Scrap` 중 `policy.deadline\_status == "closing\_soon"`인 항목을 찾는다.

5\. 해당 사용자에게 `deadline\_soon` 타입 `Notification`을 생성한다.

6\. 이미 같은 사용자, 같은 정책, 같은 알림 타입의 알림이 있으면 새로 생성하지 않는다.

7\. 생성된 알림은 기존 알림 조회 API에서 확인한다.



\---



\## 3. 사용 모델



\- `Scrap`: 사용자가 관심 정책으로 저장한 정책

\- `Policy`: 정책 정보 및 마감 상태

\- `Notification`: 사용자 알림 정보



\---



\## 4. 알림 생성 기준



아래 조건을 만족하는 `Scrap`을 대상으로 알림을 생성한다.



```text

Scrap.policy.deadline\_status == "closing\_soon"

```



\---



\## 5. 중복 방지 기준



아래 조합이 이미 존재하면 새 알림을 생성하지 않는다.



```text

user

policy

notification\_type = "deadline\_soon"

```



\---



\## 6. 생성 알림 문구



제목:



```text

스크랩한 정책의 마감이 임박했습니다.

```



내용:



```text

"{정책명}" 정책의 마감이 임박했습니다. 마이페이지 관심 정책에서 확인해 주세요.

```



\---



\## 7. 구현 파일 목록



```text

backend/apps/notifications/services.py

backend/apps/notifications/management/\_\_init\_\_.py

backend/apps/notifications/management/commands/\_\_init\_\_.py

backend/apps/notifications/management/commands/generate\_deadline\_notifications.py

documents/deadline\_notifications\_implementation.md

```



\---



\## 8. 실행 방법



로컬 환경:



```bash

cd backend

python manage.py generate\_deadline\_notifications --dry-run

python manage.py generate\_deadline\_notifications

```



Docker 환경:



```bash

docker compose exec backend python manage.py generate\_deadline\_notifications --dry-run

docker compose exec backend python manage.py generate\_deadline\_notifications

```



\---



\## 9. 테스트 케이스



\### TC-01. 마감임박 정책 스크랩 알림 생성



절차:



1\. 테스트 유저가 로그인한다.

2\. `deadline\_status`가 `closing\_soon`인 정책을 관심 정책으로 스크랩한다.

3\. `generate\_deadline\_notifications` command를 실행한다.

4\. `/api/notifications/` API를 호출한다.



기대 결과:



\- `deadline\_soon` 타입 알림이 생성된다.

\- 알림 제목과 메시지에 정책명이 포함된다.



\---



\### TC-02. 중복 알림 방지



절차:



1\. `generate\_deadline\_notifications` command를 다시 실행한다.

2\. `/api/notifications/` API를 호출한다.



기대 결과:



\- 같은 `user + policy + deadline\_soon` 알림이 중복 생성되지 않는다.



\---



\### TC-03. 알림 API 조회



절차:



1\. 로그인 토큰을 포함하여 `GET /api/notifications/` API를 호출한다.



기대 결과:



\- `notifications` 배열에서 생성된 알림을 확인할 수 있다.

\- `unread\_count` 값에 읽지 않은 알림 수가 반영된다.



\---



\## 10. 영향 범위 및 주의사항



\- 기존 `Scrap`, `Policy`, `Notification` 모델을 재사용한다.

\- 신규 모델을 만들지 않는다.

\- 기존 API 응답 형식을 변경하지 않는다.

\- 신규 migration은 발생하지 않는다.

\- 프론트 팝업, 헤더 알림 배지, 토스트 UI는 이번 구현 범위가 아니다.

\- 생성된 알림은 기존 알림 조회 API를 통해 프론트에서 표시한다.



\---



\## 11. 한 줄 요약



사용자가 관심 정책으로 스크랩한 정책 중 마감임박 상태인 정책을 찾아, 중복 없이 `deadline\_soon` 알림을 생성하는 백엔드 로직을 구현했다.

