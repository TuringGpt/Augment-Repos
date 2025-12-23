import logging
from django.db import connection

logger = logging.getLogger(__name__)

class QueryCountMiddleware:
    """
    Middleware to log query counts for each request to help identify N+1 issues.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Start tracking queries
        initial_queries = len(connection.queries)
        
        response = self.get_response(request)
        
        # Calculate queries during request
        final_queries = len(connection.queries)
        query_count = final_queries - initial_queries
        
        # Log warning if query count exceeds threshold
        if query_count > 50:
            logger.warning(f"High query count detected: {query_count} queries for {request.path}")
            
        return response
