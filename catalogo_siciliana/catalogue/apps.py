from oscar.core.loading import get_class
import oscar.apps.catalogue.apps as apps


class CatalogueConfig(apps.CatalogueConfig):
    name = 'catalogo_siciliana.catalogue'
    label = 'catalogue'
    verbose_name = 'Catálogo Siciliana'

    def ready(self):
        super().ready()
        self.category_view = get_class("catalogue.views", "ProductCategoryView")
        self.catalogue_view = get_class("catalogue.views", "CatalogueView")
        self.detail_view = get_class("catalogue.views", "ProductDetailView")
