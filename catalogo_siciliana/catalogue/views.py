from django.shortcuts import get_object_or_404, redirect
from django.views.generic import ListView, TemplateView
from django.contrib import messages
from django.utils.translation import gettext_lazy as _
from django.db.models import Q
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from oscar.apps.catalogue import views as catalogue_views
from oscar.core.loading import get_model

Product = get_model('catalogue', 'Product')
Category = get_model('catalogue', 'Category')

@method_decorator(ensure_csrf_cookie, name='dispatch')
class ProductDetailView(catalogue_views.ProductDetailView):
    template_name = "oscar/catalogue/detail.html"

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CatalogueView(ListView):
    """
    Versión personalizada de CatalogueView que usa el ORM de Django
    directamente en lugar de Haystack.
    """
    context_object_name = "products"
    template_name = "oscar/catalogue/browse.html"
    paginate_by = 20

    def get_queryset(self):
        return Product.objects.browsable().base_queryset()

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['summary'] = _("All products")
        return ctx


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ProductCategoryView(ListView):
    """
    Versión personalizada de ProductCategoryView que usa el ORM de Django
    directamente en lugar de Haystack, ya que el SimpleEngine de Haystack
    no funciona bien para mostrar productos de categorías sin una búsqueda.
    """
    context_object_name = "products"
    template_name = "oscar/catalogue/category.html"
    paginate_by = 20

    def get(self, request, *args, **kwargs):
        self.category = self.get_category()
        return super().get(request, *args, **kwargs)

    def get_category(self):
        if 'pk' in self.kwargs:
            return get_object_or_404(Category, pk=self.kwargs['pk'])
        return get_object_or_404(Category, slug=self.kwargs['category_slug'])

    def get_queryset(self):
        # Obtenemos los productos de la categoría y sus descendientes
        categories = self.category.get_descendants_and_self()
        return Product.objects.browsable().filter(
            categories__in=categories
        ).distinct().base_queryset()

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['category'] = self.category
        ctx['summary'] = self.category.name
        return ctx


class ProductSearchView(ListView):
    """
    Versión personalizada de búsqueda que usa el ORM de Django
    directamente en lugar de Haystack, para solucionar problemas
    con el SimpleEngine.
    """
    context_object_name = "products"
    template_name = "oscar/search/results.html"
    paginate_by = 20

    def get_queryset(self):
        self.query = self.request.GET.get('q', '').strip()
        qs = Product.objects.browsable().base_queryset()
        if self.query:
            qs = qs.filter(
                Q(title__icontains=self.query) |
                Q(description__icontains=self.query) |
                Q(upc__icontains=self.query)
            ).distinct()
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['query'] = self.query
        ctx['summary'] = _("Search results for '%s'") % self.query
        return ctx
