from django.conf import settings
from django.db.models import Q
from oscar.apps.catalogue.search_handlers import ProductSearchHandler as OscarProductSearchHandler
from oscar.core.loading import get_model

Product = get_model('catalogue', 'Product')

class ProductSearchHandler(OscarProductSearchHandler):
    """
    Versión personalizada de ProductSearchHandler que usa el ORM de Django
    en lugar de Haystack si el motor configurado es 'SimpleEngine', si
    estamos filtrando por categorías o si Haystack no devuelve resultados.
    """
    def _is_simple_engine(self):
        engine = settings.HAYSTACK_CONNECTIONS.get("default", {}).get("ENGINE", "")
        return engine.endswith("SimpleEngine")

    def _get_search_term(self):
        search_term = getattr(self, "search_term", None) or getattr(self, "query", None)
        if search_term is None and hasattr(self, "request"):
            search_term = self.request.GET.get("q", "")
        return search_term.strip() if search_term else ""

    def get_queryset(self):
        # Si el motor es simple, Haystack suele fallar en Oscar con filtros complejos.
        # En este caso, preferimos usar el ORM directamente para las categorías.
        qs = Product.objects.browsable().base_queryset()
        categories = getattr(self, "categories", None)
        if categories:
            qs = qs.filter(categories__in=categories).distinct()
        search_term = self._get_search_term()
        if search_term:
            qs = qs.filter(
                Q(title__icontains=search_term) |
                Q(description__icontains=search_term) |
                Q(upc__icontains=search_term)
            ).distinct()
        return qs

    def get_search_queryset(self):
        # Forzar a que use el ORM si estamos en SimpleEngine o en una categoría
        if self._is_simple_engine() or getattr(self, "categories", None):
            return self.get_queryset()
        sqs = super().get_search_queryset()
        try:
            if sqs.count() == 0:
                return self.get_queryset()
        except Exception:
            return self.get_queryset()
        return sqs
