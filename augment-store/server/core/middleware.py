import logging
from contextlib import contextmanager
from django.conf import settings
from django.db import connection, reset_queries

logger = logging.getLogger(__name__)


@contextmanager
def force_query_logging():
    """
    Context manager to force query logging even when DEBUG=False.
    This ensures connection.queries is populated in production.
    """
    force_debug_cursor = connection.force_debug_cursor
    connection.force_debug_cursor = True
    reset_queries()
    try:
        yield
    finally:
        connection.force_debug_cursor = force_debug_cursor
        reset_queries()


class QueryCountMiddleware:
    """
    Middleware to log query counts for each request to help identify N+1 issues.
    Works in both DEBUG and production environments.

    NOTE: Must be added to the MIDDLEWARE setting.
    Enable explicitly in production using ENABLE_QUERY_COUNT_LOGGING = True.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import time
        # Only enable heavy query logging if explicitly allowed or in debug mode
        if not getattr(settings, 'ENABLE_QUERY_COUNT_LOGGING', settings.DEBUG):
            return self.get_response(request)

        start_time = time.time()
        with force_query_logging():
            response = self.get_response(request)

            # Ensure response is rendered while logging is active (e.g. for DRF/TemplateResponse)
            if hasattr(response, 'render') and callable(response.render):
                response.render()

            # Calculate queries during request
            duration = time.time() - start_time
            query_count = len(connection.queries)

            # Log warning if query count exceeds threshold
            log_meta = f"queries: {query_count}, duration: {duration:.4f}s"
            if query_count > 50:
                logger.warning(f"High query count detected: {log_meta} for {request.path}")
            else:
                logger.info(f"Request metrics: {log_meta} for {request.path}")

        return response
