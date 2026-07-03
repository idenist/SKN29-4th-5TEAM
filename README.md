# 🌟 [이젠, 안쉼] 청년 지원 정보 통합 탐색 에이전트

<div align="center">
  <!-- 프로젝트 로고 이미지가 있다면 이곳에 링크를 넣어주세요 -->
  <!-- <img src="로고이미지URL" alt="이젠안쉼 로고" width="200" /> -->
  <p><strong>React + Django + LLM을 활용한 개인화 맞춤형 청년 정책 추천 서비스</strong></p>
</div>

## 📖 프로젝트 개요
**[이젠, 안쉼]**은 청년들이 자신에게 맞는 지원 정책을 쉽게 찾고 관리할 수 있도록 돕는 지능형 웹 에이전트입니다. 
복잡한 정책 검색을 AI 챗봇이 도와주며, 사용자 프로필 기반의 맞춤형 추천과 실시간 마감 알림을 통해 혜택을 놓치지 않도록 지원합니다[cite: 2].

* **개발 기간:** 2026.07.03 ~ 2026.07.09
* **팀명:** SKN29 4차 프로젝트 5팀

---

## ✨ 주요 기능 (Key Features)

### 1. 🤖 지능형 AI 정책 챗봇 (RAG)
* 사용자의 자연어 질문을 이해하고 정책을 찾아주는 LLM 기반 질의응답[cite: 2]
* 답변 대기 시간 최적화(UX) 및 타임아웃, 예외 상황 철벽 방어[cite: 2]
* 정보가 불확실할 경우 '원문 확인 필요'를 안내하여 할루시네이션(환각) 최소화[cite: 2]

### 2. 🎯 개인화 맞춤형 정책 추천
* 사용자 프로필(연령, 거주지, 관심분야)을 반영한 맞춤 정책 추천[cite: 2]
* 정책 원문을 분석하여 받을 수 있는 '최대 예상 지원금' 시각화[cite: 2]

### 3. 🔔 활동 대시보드 및 마감 알림 (마이페이지)
* 내가 스크랩(찜)한 정책, 최근 본 공고, 검색 기록 통합 관리[cite: 2]
* 스크랩한 정책의 마감일(D-7, D-3) 임박 및 변경 사항 실시간 알림[cite: 2]

### 4. 📰 청년 커뮤니티 및 정보 확장
* 인기 검색어 랭킹 실시간 집계 및 제공[cite: 2]
* 청년 키워드 뉴스(API) 및 청년 정책 유튜브 영상 모아보기[cite: 2]
* 청년들 간의 정책 후기 및 정보를 공유하는 커뮤니티 게시판[cite: 2]

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
* **Framework/Library:** React, React Router[cite: 2]
* **Styling:** CSS (Flex/Grid 기반 반응형 UI)[cite: 2]
* **HTTP Client:** Axios, Fetch API[cite: 2]

### Backend
* **Framework:** Django, Django REST Framework (DRF)[cite: 2]
* **Authentication:** JWT (djangorestframework-simplejwt)[cite: 2]
* **Database:** PostgreSQL (AWS RDS)[cite: 2]
* **Task Queue:** Celery (정책 마감일/알림 스케줄링)[cite: 2]

### AI / Data
* **LLM Engine:** LangChain/LangGraph, OpenAI API[cite: 2]
* **Vector DB:** ChromaDB[cite: 2]

### Infrastructure & Deployment
* **Server:** AWS EC2, AWS S3 (프로필 이미지 스토리지)[cite: 2]
* **Web Server / WSGI:** Nginx, Gunicorn[cite: 2]
* **Container:** Docker, Docker Compose[cite: 2]

---

## 👥 팀원 및 역할 (Team Roles)

| 이름 | 포지션 | 담당 업무 |
| :---: | :--- | :--- |
| **한예나** | PM & Frontend Sub | • 4대 필수 산출물 총괄(요구사항, 화면설계, 테스트 결과 등)<br>• 청년 뉴스, 유튜브 영상, 커뮤니티, 개인정보방침 UI 구현<br>• 프론트엔드-백엔드 연동 테스트(QA) 및 발표 시나리오 작성 |
| **송민지** | Frontend Lead | • React 프로젝트 뼈대 구축 및 공통 레이아웃/컴포넌트 설계<br>• LLM 챗봇 비동기 대기 상태 UX(로딩 스피너/에러) 집중 구현<br>• 맞춤 정책 검색, 마이페이지 구현 및 AWS S3 정적 배포 |
| **한경찬** | Backend Core Lead | • Django MVT/ORM 기반 공통 API 및 JWT 인증/권한 구축<br>• 정책, 스크랩, 마이페이지, 유저 DB 모델(ERD) 설계<br>• Nginx + Gunicorn + Django Dockerizing 및 실서버 운영 |
| **윤승혁** | AI Backend Lead | • RAG 파이프라인 Django 서버 이식 및 LLM 챗봇 API 개발<br>• 유저 프로필 기반 맞춤형 정책 추천 및 예상 지원금 추출<br>• LLM 예외 상황(타임아웃) 처리 및 시스템 구성도 아키텍처 설계 |
| **정승** | Data & AWS Deploy Lead | • 2,600여 개 정책 데이터 DB 적재 및 마감일 상태 자동 갱신<br>• 인기 검색어 집계 및 스크랩 공고 마감 임박 알림(Push) 생성<br>• AWS EC2 인스턴스/RDS/S3 인프라 구축 및 Docker Compose 배포 |

---

## 🏗 시스템 아키텍처 (System Architecture)
*(윤승혁 님이 작성하실 시스템 구성도 이미지가 완성되면 아래 위치에 업데이트하세요.)*

<!-- <img src="./documents/assets/system_architecture.png" alt="시스템 구성도" width="800" /> -->
* **클라이언트 흐름:** React Frontend ➔ Nginx (Reverse Proxy) ➔ Gunicorn ➔ Django API[cite: 2]
* **데이터 관리:** AWS RDS(PostgreSQL)에 회원/정책 데이터 저장, AWS S3에 프로필 이미지 저장[cite: 2]
* **AI 연동:** Django 백엔드에서 RAG 엔진 및 외부 LLM API(OpenAI) 호출[cite: 2]

---

## 🚀 시작하기 (Getting Started)

### 요구 사항 (Prerequisites)
* Node.js
* Python 3.x
* Docker & Docker Compose

### 로컬 실행 방법 (Local Run)
1. 레포지토리 클론
```bash
git clone [https://github.com/idenist/SKN29-4th-5TEAM.git](https://github.com/idenist/SKN29-4th-5TEAM.git)
cd SKN29-4th-5TEAM
