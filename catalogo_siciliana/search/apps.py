from oscar.apps.search.apps import SearchConfig as OscarSearchConfig
from oscar.core.loading import get_class

class SearchConfig(OscarSearchConfig):
    name = 'catalogo_siciliana.search'
    label = 'search'

    def ready(self):
        super().ready()
        # Use the ORM-based search view for SimpleEngine compatibility.
        self.search_view = get_class("catalogue.views", "ProductSearchView")
