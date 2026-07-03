"""
ASGI config for the project.

Exposes the ASGI callable as a module-level variable named ``application``.
비동기 처리(WebSocket 등) 확장이 필요할 때 사용.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()