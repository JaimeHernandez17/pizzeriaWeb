import os
from pathlib import Path

from django.urls import reverse_lazy
from oscar.defaults import *  # noqa: F403

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-default-change-me-in-production')

DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() == 'true'

# ==============================
# DJANGO CORE
# ==============================

NGROK_URL = os.getenv("MERCADOPAGO_PUBLIC_BASE_URL", "")
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]
# ALLOWED_HOSTS = ["*"]
if NGROK_URL:
    # Extraer el host de la URL de ngrok (p. ej. "abc.ngrok-free.dev")
    ngrok_host = NGROK_URL.replace("https://", "").replace("http://", "").split("/")[0]
    if ngrok_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(ngrok_host)

CSRF_TRUSTED_ORIGINS = ["http://localhost:8049", "http://127.0.0.1:8049"]
if NGROK_URL:
    CSRF_TRUSTED_ORIGINS.append(NGROK_URL)

# Si estamos en desarrollo, podemos ser más permisivos con los orígenes para pruebas en red local
import socket
try:
    # Intenta obtener la IP de la interfaz de red principal
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    local_ip = s.getsockname()[0]
    s.close()
    if local_ip:
        CSRF_TRUSTED_ORIGINS.append(f"http://{local_ip}:8049")
except Exception:
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        CSRF_TRUSTED_ORIGINS.append(f"http://{local_ip}:8049")
    except Exception:
        pass

# Permitir que el frontend envíe tokens CSRF desde cualquier origen en desarrollo
# o simplemente confiar en que el navegador maneje las cookies correctamente
# dado que estamos en el mismo dominio.
# Si el teléfono usa una IP distinta, esto puede ser un problema.
# Django 4.0+ requiere que el origen esté en CSRF_TRUSTED_ORIGINS para POST.

if not DEBUG:
    # Para que Django confíe en el protocolo HTTPS enviado por el proxy reverso
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_SSL_REDIRECT = os.getenv('DJANGO_SECURE_SSL_REDIRECT', 'False').lower() == 'true'
    X_FRAME_OPTIONS = 'DENY'
    # HSTS
    SECURE_HSTS_SECONDS = 31536000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
else:
    # Configuraciones adicionales para sesiones y CSRF seguras cuando se usa HTTPS (ngrok) en desarrollo
    if NGROK_URL and NGROK_URL.startswith("https"):
        CSRF_COOKIE_SECURE = False
        SESSION_COOKIE_SECURE = False
        CSRF_COOKIE_SAMESITE = 'Lax'
        SESSION_COOKIE_SAMESITE = 'Lax'
        CSRF_COOKIE_HTTPONLY = False

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.flatpages',

    # Oscar core apps
    'oscar.config.Shop',
    'oscar.apps.analytics.apps.AnalyticsConfig',
    'catalogo_siciliana.checkout.apps.CheckoutConfig',
    'catalogo_siciliana.address.apps.AddressConfig',
    'catalogo_siciliana.shipping.apps.ShippingConfig',
    'catalogo_siciliana.catalogue.apps.CatalogueConfig',
    'oscar.apps.catalogue.reviews.apps.CatalogueReviewsConfig',
    'oscar.apps.communication.apps.CommunicationConfig',
    'oscar.apps.partner.apps.PartnerConfig',
    'oscar.apps.basket.apps.BasketConfig',
    'oscar.apps.payment.apps.PaymentConfig',
    'oscar.apps.offer.apps.OfferConfig',
    'catalogo_siciliana.order.apps.OrderConfig',
    'oscar.apps.customer.apps.CustomerConfig',
    'catalogo_siciliana.locations.apps.LocationsConfig',
    'catalogo_siciliana.search.apps.SearchConfig',
    'oscar.apps.voucher.apps.VoucherConfig',
    'oscar.apps.wishlists.apps.WishlistsConfig',

    # Oscar dashboard apps
    'oscar.apps.dashboard.apps.DashboardConfig',
    'oscar.apps.dashboard.reports.apps.ReportsDashboardConfig',
    'oscar.apps.dashboard.users.apps.UsersDashboardConfig',
    'oscar.apps.dashboard.orders.apps.OrdersDashboardConfig',
    'oscar.apps.dashboard.catalogue.apps.CatalogueDashboardConfig',
    'oscar.apps.dashboard.offers.apps.OffersDashboardConfig',
    'oscar.apps.dashboard.partners.apps.PartnersDashboardConfig',
    'oscar.apps.dashboard.pages.apps.PagesDashboardConfig',
    'oscar.apps.dashboard.ranges.apps.RangesDashboardConfig',
    'oscar.apps.dashboard.reviews.apps.ReviewsDashboardConfig',
    'oscar.apps.dashboard.vouchers.apps.VouchersDashboardConfig',
    'oscar.apps.dashboard.communications.apps.CommunicationsDashboardConfig',
    'oscar.apps.dashboard.shipping.apps.ShippingDashboardConfig',

    # Third-party
    'widget_tweaks',
    'django_tables2',
    'treebeard',
    'sorl.thumbnail',
    'haystack',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'oscar.apps.basket.middleware.BasketMiddleware',
    'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',

                # Oscar context processors
                'oscar.apps.search.context_processors.search_form',
                'oscar.apps.checkout.context_processors.checkout',
                'oscar.apps.communication.notifications.context_processors.notifications',
                'oscar.core.context_processors.metadata',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ==============================
# DATABASE
# ==============================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'pizzeria_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# ==============================
# PASSWORDS
# ==============================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ==============================
# AUTHENTICATION
# ==============================

AUTHENTICATION_BACKENDS = [
    'oscar.apps.customer.auth_backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# ==============================
# INTERNACIONALIZACIÓN
# ==============================

LANGUAGE_CODE = 'es-co'

TIME_ZONE = 'America/Bogota'

USE_I18N = True
USE_TZ = True

# ==============================
# STATIC & MEDIA
# ==============================

STATIC_URL = 'static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ==============================
# LOCALE
# ==============================

LOCALE_PATHS = [os.path.join(BASE_DIR, 'locale')]

# ==============================
# FIXTURES
# ==============================

FIXTURE_DIRS = [os.path.join(BASE_DIR, 'fixtures')]

# ==============================
# DEFAULT AUTO FIELD
# ==============================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Use Oscar's original migrations for overridden apps that don't define their own migrations.
MIGRATION_MODULES = {
    "address": "oscar.apps.address.migrations",
    "shipping": "oscar.apps.shipping.migrations",
    "order": "oscar.apps.order.migrations",
}

# ==============================
# EMAIL
# ==============================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('EMAIL_HOST_USER', '')
OSCAR_FROM_EMAIL = os.getenv('EMAIL_HOST_USER', '')

# ==============================
# WOMPI
# ==============================

WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "")
WOMPI_CURRENCY = os.getenv("WOMPI_CURRENCY", "COP")
WOMPI_CHECKOUT_URL = os.getenv("WOMPI_CHECKOUT_URL", "https://checkout.wompi.co/p/")

# ==============================
# MERCADOPAGO
# ==============================

MERCADOPAGO_PUBLIC_KEY = os.getenv("MERCADOPAGO_PUBLIC_KEY", "")
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
MERCADOPAGO_WEBHOOK_SECRET = os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "")
MERCADOPAGO_CURRENCY = os.getenv("MERCADOPAGO_CURRENCY", "COP")
MERCADOPAGO_API_BASE = os.getenv("MERCADOPAGO_API_BASE", "https://api.mercadopago.com")
MERCADOPAGO_PUBLIC_BASE_URL = os.getenv("MERCADOPAGO_PUBLIC_BASE_URL", "")

# ==============================
# ORDER STATUS
# ==============================

OSCAR_ORDER_STATUS_PIPELINE = {
    "Pendiente de pago": ("Pagado", "Cancelado"),
    "Pagado": ("Preparando", "Cancelado"),
    "Preparando": ("En camino", "Cancelado"),
    "En camino": ("Entregado", "Cancelado"),
    "Entregado": (),
    "Cancelado": (),
}

OSCAR_INITIAL_ORDER_STATUS = "Pendiente de pago"
OSCAR_INITIAL_LINE_STATUS = "Pendiente de pago"

# ==============================
# HAYSTACK (search backend)
# ==============================

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.simple_backend.SimpleEngine',
    },
}

# ==============================
# DJANGO OSCAR CONFIG
# ==============================

OSCAR_ALLOW_ANON_CHECKOUT = True
OSCAR_SHOP_NAME = 'Pizzería Siciliana'
OSCAR_SHOP_TAGLINE = 'La mejor pizza'

OSCAR_DYNAMIC_CLASS_LOADER = "config.oscar_loading.compat_class_loader"

OSCAR_SLUG_ALLOW_UNICODE = False

OSCAR_REQUIRED_ADDRESS_FIELDS = [
    "first_name",
    "last_name",
    "line1",
    "line4",
]

# ==============================
# SHIPPING COSTS
# ==============================

PIZZERIA_COORDS = {
    "lat": float(os.getenv("PIZZERIA_LAT")) if os.getenv("PIZZERIA_LAT") else None,
    "lng": float(os.getenv("PIZZERIA_LNG")) if os.getenv("PIZZERIA_LNG") else None,
}
SHIPPING_BASE_PRICE = os.getenv("SHIPPING_BASE_PRICE", "7000")
SHIPPING_PRICE_PER_KM = os.getenv("SHIPPING_PRICE_PER_KM", "1000")
SHIPPING_MIN_PRICE = os.getenv("SHIPPING_MIN_PRICE", "7000")

OSCAR_PRODUCTS_PER_PAGE = 20

OSCAR_CURRENCY = "COP"
OSCAR_DEFAULT_CURRENCY = "COP"

OSCAR_DELETE_IMAGE_FILES = True

OSCAR_THUMBNAILER = 'oscar.core.thumbnails.SorlThumbnail'

OSCAR_HOMEPAGE = reverse_lazy('catalogue:index')

OSCAR_SEARCH_FACETS = {
    'fields': {
        'product_class': {'name': 'Tipo', 'field': 'product_class'},
        'rating': {'name': 'Calificación', 'field': 'rating'},
    },
    'queries': {
        'price_range': {
            'name': 'Rango de precio',
            'field': 'price',
            'queries': [
                ('0 a 20000', '[0 TO 20000]'),
                ('20000 a 40000', '[20000 TO 40000]'),
                ('40000 a 60000', '[40000 TO 60000]'),
                ('60000+', '[60000 TO *]'),
            ],
        },
    },
}

# ==============================
# AUTH REDIRECTS
# ==============================

LOGIN_REDIRECT_URL = reverse_lazy('customer:summary')
LOGIN_URL = reverse_lazy('customer:login')

# ==============================
# VITE CONFIGURATION
# ==============================

VITE_DEV_MODE = os.getenv("VITE_DEV_MODE", "False").lower() == "true"
VITE_DEV_SERVER_URL = os.getenv("VITE_DEV_SERVER_URL", "http://localhost:5173/")
