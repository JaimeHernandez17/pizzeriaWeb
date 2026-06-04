"""
URL configuration for the config project.

The `urlpatterns` list routes URLs to views. For more information, please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.apps import apps
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from catalogo_siciliana.catalogue import api as catalogue_api
from catalogo_siciliana.checkout import cart_api as cart_api
from catalogo_siciliana.checkout import views as checkout_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/v1/catalog/products/", catalogue_api.catalogue_products_api, name="api-catalog-products"),
    path("api/v1/catalog/products/<int:product_id>/", catalogue_api.product_detail_api, name="api-product-detail"),
    path("api/v1/catalog/products/<int:product_id>/reviews/", catalogue_api.submit_review_api, name="api-product-reviews"),
    path("api/v1/cart/", cart_api.cart_detail_api, name="api-cart-detail"),
    path("api/v1/cart/items/", cart_api.cart_items_api, name="api-cart-items"),
    path("api/v1/cart/items/<int:line_id>/", cart_api.cart_item_detail_api, name="api-cart-item-detail"),
    path('pagos/wompi/retorno/', checkout_views.WompiReturnView.as_view(), name='wompi-return'),
    path('pagos/wompi/webhook/', checkout_views.wompi_webhook, name='wompi-webhook'),
    path('checkout/mercado/pago/return/', checkout_views.MercadoPagoReturnView.as_view(), name='mercadopago-return'),
    path('checkout/mercado/pago/webhook/', checkout_views.mercadopago_webhook, name='mercadopago-webhook'),
    path('checkout/tracking/<str:order_number>/', checkout_views.OrderTrackingView.as_view(), name='order-tracking'),
    path('checkout/order-lookup/', checkout_views.OrderLookupView.as_view(), name='order-lookup'),
    path('checkout/mercado/pago/waiting/', checkout_views.MercadoPagoWaitingView.as_view(), name='mercadopago-waiting'),
    path('checkout/mercado/pago/status/', checkout_views.MercadoPagoStatusCheckView.as_view(), name='mercadopago-status'),
    path('', include(apps.get_app_config('oscar').urls[0])),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
