"""
ASGI (Asynchronous Server Gateway Interface) configuration for the core
Django project.

This module configures the ASGI application server interface, which
enables Django to handle asynchronous requests, WebSockets, and
long-lived connections. ASGI is the spiritual successor to WSGI and
provides a standard interface between async-capable Python web servers,
frameworks, and applications.

The module exposes the ASGI callable as a module-level variable named
``application``, which is used by ASGI servers (such as Daphne, Uvicorn,
or Hypercorn) to serve the Django application.

Usage:
    Deploy with an ASGI server like Uvicorn:
        $ uvicorn core.asgi:application --host 0.0.0.0 --port 8000

    Or with Daphne:
        $ daphne -b 0.0.0.0 -p 8000 core.asgi:application

For more information on ASGI deployment, see:
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_asgi_application()
