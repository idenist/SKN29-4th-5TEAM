# 🏛️ [4차 프로젝트 5팀] 청년 정책 맞춤형 추천 플랫폼 README

> **Frontend Sub / QA & Deliverable Manager:** 한예나 매니저
> **뉴스 페이지 요구사항 ID:** `REQ-F-08`

본 문서는 SKN 29기 4차 프로젝트 5팀의 전체 시스템 구조, 환경 변수 설정, 데이터 파이프라인 및 배포 환경을 총망라한 개발자 가이드이자 프로젝트 전체 리드미(`README.md`) 문서입니다.

---

## 🛠️ 1. 기술 스택 및 배포 아키텍처

### 💻 Development Stack
* **Frontend:** React, Vite, Axios, Lucide React
* **Backend:** Django REST Framework (DRF), Gunicorn
* **AI / RAG:** LangGraph, OpenAI API (`text-embedding-3-small`), Chroma DB, Neo4j AuraDB
* **Data Processing:** KoNLPy (Okt Analyzer), JPype1, Pandas, Scikit-learn, Gensim, Scipy

### 🌐 Infra & Deployment Architecture
* **Cloud Infrastructure:** AWS EC2, AWS RDS (PostgreSQL), AWS S3
* **Containerization & Web Server:** Docker, Docker Compose, Nginx
* **Production Server URIs:**
  * **Frontend Web:** `http://52.78.46.170/` (Nginx 정적 서빙 및 Reverse Proxy)
  * **Backend API:** `http://52.78.46.170/api/` (Gunicorn 프록시 연동)
  * **Django Admin:** `http://52.78.46.170/admin/`

---

## ⚙️ 2. 환경 변수 설정 가이드 (`.env`)

서비스 구동을 위해 `backend/.env` 파일에 아래와 같은 규격의 환경 변수 설정이 필요합니다. (실제 운영용 패스워드 및 키 정보가 담긴 엑셀 데이터는 별도 관리됩니다.)

```env
# Django Core Config
DJANGO_SECRET_KEY=your_secret_key_here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,52.78.46.170

# Database (AWS RDS PostgreSQL 실배포 연동)
DB_NAME=youth_search
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=skn29-youth-search-db.cz46igeuk7s4.ap-northeast-2.rds.amazonaws.com
DB_PORT=5432

# AWS S3 (유저 프로필 이미지 업로드 저장소)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_STORAGE_BUCKET_NAME=skn29-youth-profile-images
AWS_S3_REGION_NAME=ap-northeast-2

# AI / RAG Engine (OpenAI & Vector DB)
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
CHROMA_PERSIST_DIR=/app/data/vector_db
CHROMA_COLLECTION_NAME=youth_policy_chunks

# Hybrid RAG (Neo4j AuraDB)
NEO4J_URI=your_neo4j_uri
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# External Search Fallback (Tavily Web Search)
TAVILY_API_KEY=your_tavily_api_key
EXTERNAL_WEB_SEARCH_ENABLED=true
ENABLE_DDG_HTML_SEARCH=false
TAVILY_SEARCH_DEPTH=basic
TAVILY_INCLUDE_RAW_CONTENT=false
CURRENT_POLICY_YEAR=2026

# Email Verification (인증용)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# NAVER API (Frontend 뉴스 페이지 우회용)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

프론트엔드 환경 변수(`frontend/.env.local`) 설정 규칙:

```env
VITE_API_BASE_URL=[http://52.78.46.170/api](http://52.78.46.170/api)
```

## 📁 3. 멀티 컨테이너 구성 (`docker-compose.yml`)

본 서비스는 `skn29-4th-5team` 프로젝트명 하에 총 3개의 핵심 서비스 컨테이너가 단일 가상 네트워크(`skn29-4th-5team_default`) 안에서 조율되어 가동됩니다.

version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      - CHROMA_PERSIST_DIR=/app/data/vector_db
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - ./data/vector_db:/app/data/vector_db
    expose:
      - "8000"

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - static_volume:/app/staticfiles
      - ./frontend/dist:/app/frontend/dist
    depends_on:
      - backend

volumes:
  postgres_data:
  static_volume:

  ## 🤖 4. AI RAG 데이터 파이프라인 및 백엔드 배치

### 🗂️ KoNLPy 기반 데이터 분석 및 전처리
한국어 자연어 처리를 위해 `run_konlpy_setup.bat` 환경 구성 스크립트를 기반으로 JPype1 및 KoNLPy Okt 형태소 분석기를 가동합니다. 이를 통해 정책 본문에서 핵심 명사를 추출하고 데이터의 가독성과 임베딩 품질을 극대화합니다.

### 💾 Chroma Vector DB 적재 및 영속화
`scripts/build_vector_db.py` 를 활용하여 정제된 청년 정책 텍스트 청크를 `text-embedding-3-small` 모델로 벡터화한 뒤 Chroma DB에 적재합니다.

* **영속성 유지:** EC2 호스트 경로(` /home/ubuntu/SKN29-4th-5TEAM/data/vector_db `)와 컨테이너 내부 경로를 바인드 마운트하여 컨테이너가 재생성되더라도 약 423MB 볼륨 크기의 `chroma.sqlite3` 인덱스 데이터가 안전하게 유지됩니다.

수동 적재 명령어 예시:

```bash
python scripts/build_vector_db.py --input data/processed/chunks_for_chroma.jsonl --persist-dir data/vector_db --reset
```

### 💬 스마트 AI 챗봇 API 스펙 (`POST /api/ai/chat/`)
사용자의 자연어 질의(`message`)와 유저 프로필 변수(`user_profile`)를 조합하여 하이브리드 RAG 엔진을 구동합니다.

* **신청 조건 뱃지 기능:** 대화 컨텍스트에서 실시간 조건 부합 여부를 판별하여 프론트엔드 카드 UI에 바인딩할 `eligibility_badge_type` 규격(`success`=초록, `warning`=노랑/주황, `danger`=빨강)을 동적으로 도출합니다.
* **예상 지원 혜택 산정:** 금액 산출 로직에 따라 개인 맞춤형 지원금 합산액 정보(`max_total_benefit_text`)를 계산하여 화면에 시각화합니다.

## 📰 5. 뉴스 페이지 프록시 우회 및 UI 사양 (`REQ-F-08`)

프론트엔드 단독 통신 아키텍처 환경에서 Naver 실시간 속보 API 호출 시 발생하는 CORS 에러를 우회하도록 설계되었습니다.

* **Vite Proxy 보안 설정:** `frontend/vite.config.js` 및 웹 서버 Nginx 프록시 단에서 외부 오픈 API 엔드포인트를 direct 바인딩하여 브라우저 제약을 방지합니다.
* **데이터 인터페이스 준수:** `NewsCard` 컴포넌트와의 결합도 유지를 위해 `title`, `summary`, `source`, `publishedAt`, `category`, `tags`, `url` 데이터 규격을 상시 동기화합니다.

## 🚀 6. 개발 환경 및 서비스 구동 방법

### 📦 프론트엔드 패키지 로컬 실행

```bash
cd frontend
npm install
npm run dev
```

### 🐋 Docker Compose 전체 가동 (배포 및 로컬 테스트)

```bash
# 프로젝트 루트 경로에서 백그라운드 빌드 가동
docker-compose up --build -d

# 컨테이너 상태 및 헬스체크 확인
docker-compose ps
```
