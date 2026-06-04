from django.conf import settings
from oscar.apps.search.forms import CategoryForm as OscarCategoryForm

class CategoryForm(OscarCategoryForm):
    def no_query_found(self):
        """
        Return Queryset of all the results.
        """
        sqs = super(OscarCategoryForm, self).no_query_found()
        
        # El SimpleEngine de Haystack no soporta __in en filtros de modelos
        # a través de la interfaz de Haystack de forma fiable.
        # Sin embargo, si tenemos una lista de IDs de categoría, 
        # en SimpleEngine podemos intentar filtrar por una de ellas.
        # Para que funcione mejor, simplemente filtramos por la primera si hay alguna.
        # En una pizzería, normalmente un producto está en una sola categoría.
        
        if self.categories:
            category_ids = list(self.categories.values_list("pk", flat=True))
            # Intentamos con el primer ID ya que SimpleEngine suele fallar con __in
            if category_ids:
                return sqs.filter(category=category_ids[0])
        
        return sqs
