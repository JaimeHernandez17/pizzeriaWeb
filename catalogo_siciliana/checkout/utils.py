import hmac
import json
from decimal import Decimal
import hashlib
import uuid
from django.conf import settings
from django.urls import reverse
from oscar.apps.checkout.utils import CheckoutSessionData as CoreCheckoutSessionData
from oscar.core.loading import get_class, get_model

ShippingAddress = get_model("order", "ShippingAddress")
Basket = get_model("basket", "Basket")
Selector = get_class("partner.strategy", "Selector")

def _amount_to_cents(amount):
    return int((amount * Decimal("100")).quantize(Decimal("1")))


def _build_reference(basket_id):
    return f"wompi-{basket_id}-{uuid.uuid4().hex[:12]}"


def _build_wompi_signature(reference, amount_in_cents, currency, integrity_secret, expiration_time=None):
    raw = f"{reference}{amount_in_cents}{currency}"
    if expiration_time:
        raw += str(expiration_time)
    raw += integrity_secret
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _build_reference_with_prefix(prefix, basket_id):
    return f"{prefix}-{basket_id}-{uuid.uuid4().hex[:12]}"


def _serialize_address(address):
    data = {}
    for field in address._meta.fields:
        if field.name == "id":
            continue
        value = getattr(address, field.attname)
        if hasattr(value, "as_international"):
            value = value.as_international
        data[field.attname] = value
    return data


def _get_nested_value(data, path):
    current = data
    for key in path.split("."):
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _is_valid_wompi_event(payload):
    secret = settings.WOMPI_EVENTS_SECRET
    if not secret:
        return False

    signature = payload.get("signature") or {}
    checksum = signature.get("checksum")
    properties = signature.get("properties") or []
    timestamp = payload.get("timestamp")
    if not checksum or not properties or timestamp is None:
        return False

    data = payload.get("data", {})
    parts = []
    for prop in properties:
        value = _get_nested_value(data, prop)
        if value is None:
            return False
        parts.append(str(value))

    raw = "".join(parts) + str(timestamp) + secret
    expected = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return expected.lower() == str(checksum).lower()


def _is_valid_mercadopago_signature(request, raw_body):
    secret = settings.MERCADOPAGO_WEBHOOK_SECRET
    if not secret:
        return False

    header = request.headers.get("x-signature") or request.headers.get("X-Signature")
    if not header:
        return False
    parts = {}
    for chunk in header.split(","):
        if "=" in chunk:
            key, value = chunk.split("=", 1)
            parts[key.strip()] = value.strip()
    ts = parts.get("ts")
    signature = parts.get("v1")
    if not ts or not signature:
        return False

    request_id = request.headers.get("x-request-id") or request.headers.get("X-Request-Id")
    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except (TypeError, ValueError):
        payload = {}
    data_id = request.GET.get("data.id") or request.GET.get("id") or (payload.get("data", {}) or {}).get("id")
    if isinstance(data_id, str):
        data_id = data_id.lower()

    manifest_parts = []
    if data_id:
        manifest_parts.append(f"id:{data_id};")
    if request_id:
        manifest_parts.append(f"request-id:{request_id};")
    manifest_parts.append(f"ts:{ts};")
    manifest = "".join(manifest_parts)
    expected = hmac.new(secret.encode("utf-8"), manifest.encode("utf-8"), hashlib.sha256).hexdigest()
    return expected.lower() == signature.lower()


def _thaw_basket(basket):
    if basket and basket.status == Basket.FROZEN:
        basket.thaw()


def _assign_strategy(basket, user=None):
    if not basket:
        return
    if not getattr(basket, "has_strategy", False):
        basket.strategy = Selector().strategy(
            request=None, user=user or basket.owner, basket=basket
        )


class CheckoutSessionData(CoreCheckoutSessionData):
    def _sanitize_address_fields(self, address_fields):
        if not address_fields:
            return address_fields

        allowed = set()
        for field in ShippingAddress._meta.fields:
            allowed.add(field.name)
            allowed.add(field.attname)

        return {key: value for key, value in address_fields.items() if key in allowed}

    def ship_to_new_address(self, address_fields):
        cleaned = self._sanitize_address_fields(address_fields)
        super().ship_to_new_address(cleaned)

    def new_shipping_address_fields(self):
        fields = super().new_shipping_address_fields()
        cleaned = self._sanitize_address_fields(fields)
        if fields is not None and cleaned != fields:
            self._set("shipping", "new_address_fields", cleaned)
        return cleaned
