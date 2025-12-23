import logging
from contextlib import contextmanager
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
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        with force_query_logging():
            response = self.get_response(request)

            # Calculate queries during request
            query_count = len(connection.queries)

            # Log warning if query count exceeds threshold
            if query_count > 50:
                logger.warning(f"High query count detected: {query_count} queries for {request.path}")

        return response
