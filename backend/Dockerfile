# backend/Dockerfile

FROM python:3.11-slim

# 파이썬 출력 버퍼링 방지, .pyc 파일 생성 방지
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 시스템 의존성 (psycopg2 등 PostgreSQL 클라이언트 빌드용)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# 파이썬 의존성 먼저 설치 (레이어 캐시 활용)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# 프로젝트 소스 복사
COPY . .

# 정적 파일 수집 (배포 시 Nginx가 서빙)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn_config.py", "config.wsgi:application"]