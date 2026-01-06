import shlex
from django.db.models import Q

class SearchQueryParser:
    """
    Utility to parse search queries into components.
    Supports basic terms and quoted strings for grouped matches.
    """
    
    @staticmethod
    def parse(query: str):
        if not query:
            return []
        
        try:
            # shlex.split handles quoted strings naturally
            return shlex.split(query)
        except ValueError:
            # Fallback for unclosed quotes
            return query.split()

class AdvancedSearchMixin:
    """
    Mixin to enhance model filtering with advanced search capabilities.
    """
    
    search_fields = ()

    def get_search_query_filter(self, query_string: str):
        if not query_string or not self.search_fields:
            return Q()

        terms = SearchQueryParser.parse(query_string)
        root_query = Q()

        for term in terms:
            term_query = Q()
            for field in self.search_fields:
                term_query &= Q(**{f"{field}__icontains": term})
            root_query &= term_query

        return root_query
