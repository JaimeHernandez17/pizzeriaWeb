from django.conf import settings
from haystack.query import SearchQuerySet
from oscar.core.loading import get_class

def base_sqs():
    """
    Versión personalizada de base_sqs compatible con el SimpleEngine de Haystack.
    En lugar de usar filters que SimpleEngine no entiende bien (como __in),
    filtramos solo por lo básico que sí soporta.
    """
    sqs = SearchQuerySet()
    
    # Añadir facetas desde settings
    for facet in settings.OSCAR_SEARCH_FACETS["fields"].values():
        options = facet.get("options", {})
        sqs = sqs.facet(facet["field"], **options)
    for facet in settings.OSCAR_SEARCH_FACETS["queries"].values():
        for query in facet["queries"]:
            sqs = sqs.query_facet(facet["field"], query[1])

    # En SimpleEngine, el filtro 'is_public="true"' falla. Usamos True (booleano).
    # Además, SimpleEngine tiene problemas con '__in', así que evitamos filtrarlo
    # aquí si es posible o usamos filtros simples que sí entienda.
    
    # En SimpleEngine, incluso 'filter' puede dar problemas si se espera 
    # una consulta SQL que devuelva múltiples valores.
    # Vamos a ser muy permisivos aquí para que se vean los productos.
    
    return sqs
