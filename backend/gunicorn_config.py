# backend/gunicorn_config.py

import multiprocessing

# 바인딩 주소 (컨테이너 내부 포트, Nginx가 이 포트로 프록시)
bind = "0.0.0.0:8000"

# 워커 프로세스 수 (CPU 코어 수 기반, 너무 많으면 메모리 낭비되니 상한을 둠)
workers = min(multiprocessing.cpu_count() * 2 + 1, 5)

# 워커 타임아웃 (초) - AI 응답(OpenAI/RAG)이 오래 걸릴 수 있어 넉넉하게 설정
timeout = 120

# 워커 타입
worker_class = "sync"

# 로그
accesslog = "-"   # stdout으로 출력 (Docker 로그로 확인 가능)
errorlog = "-"
loglevel = "info"

# 워커 재시작 관련 (메모리 누수 방지)
max_requests = 1000
max_requests_jitter = 50