"""
WSGI config for the project.

Exposes the WSGI callable as a module-level variable named ``application``.
Gunicorn(gunicorn_config.py)이 이 모듈을 통해 서버를 구동한다.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()