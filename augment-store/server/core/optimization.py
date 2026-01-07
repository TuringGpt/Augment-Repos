import hashlib


class AutoOptimizeMixin:
    """
    Mixin to automatically apply select_related and prefetch_related based on configuration.
    """
    auto_select_related = ()
    auto_prefetch_related = ()

    def get_queryset(self):
        queryset = super().get_queryset()

        if self.auto_select_related:
            queryset = queryset.select_related(*self.auto_select_related)

        if self.auto_prefetch_related:
            queryset = queryset.prefetch_related(*self.auto_prefetch_related)

        return queryset

def get_query_hash(query_string):
    """
    Generate a hash for a query string.
    """
    return hashlib.md5(query_string.encode('utf-8')).hexdigest()
