from __future__ import annotations

import json
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_GET, require_http_methods

from oscar.core.loading import get_model

Product = get_model("catalogue", "Product")


def _money(amount) -> str:
    if amount is None:
        amount = Decimal("0.00")
    try:
        value = Decimal(amount)
    except (TypeError, InvalidOperation):
        value = Decimal("0.00")
    return str(value.quantize(Decimal("0.01")))


def _load_payload(request) -> dict:
    # Always check request.POST first in case Django already parsed it
    if request.POST:
        return request.POST.dict()

    if not request.body:
        print("DEBUG: _load_payload: request.body is empty and no POST data")
        return {}

    content_type = request.META.get("CONTENT_TYPE", "")
    if "application/json" not in content_type:
        print(f"DEBUG: _load_payload: content_type is not JSON and no POST data: {content_type}")
        return {}

    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception as e:
        print(f"DEBUG: _load_payload: json.loads failed: {e}")
        return {}


def _serialize_line(request, line) -> dict:
    image = line.product.primary_image()
    image_url = ""
    if image and getattr(image, "original", None):
        image_url = request.build_absolute_uri(image.original.url)

    return {
        "id": line.id,
        "quantity": line.quantity,
        "product": {
            "id": line.product.id,
            "title": line.product.title,
            "slug": line.product.slug,
            "url": line.product.get_absolute_url(),
            "image_url": image_url,
        },
        "price": {
            "currency": line.price_currency
            or request.basket.currency
            or settings.OSCAR_DEFAULT_CURRENCY,
            "unit_incl_tax": _money(line.unit_price_incl_tax),
            "line_incl_tax": _money(line.line_price_incl_tax_incl_discounts),
            "line_excl_tax": _money(line.line_price_excl_tax_incl_discounts),
        },
    }


def _serialize_basket(request) -> dict:
    basket = request.basket
    lines = [_serialize_line(request, line) for line in basket.all_lines()]
    return {
        "id": basket.id,
        "currency": basket.currency or settings.OSCAR_DEFAULT_CURRENCY,
        "num_items": basket.num_items,
        "num_lines": basket.num_lines,
        "total_incl_tax": _money(basket.total_incl_tax),
        "total_excl_tax": _money(basket.total_excl_tax),
        "lines": lines,
    }


def _refresh_basket_state(basket):
    basket.reset_offer_applications()
    basket._lines = None


def _basket_line_or_404(request, line_id: int):
    line = (
        request.basket.lines.select_related("product", "stockrecord")
        .filter(id=line_id)
        .first()
    )
    if not line:
        raise Http404("Line not found")
    return line


@require_GET
def cart_detail_api(request):
    return JsonResponse(_serialize_basket(request))


from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@require_http_methods(["POST"])
def cart_items_api(request):
    print(f"DEBUG: cart_items_api: request.method={request.method}, content_type={request.META.get('CONTENT_TYPE')}")
    payload = _load_payload(request)
    print(f"DEBUG: cart_items_api: payload={payload}")

    try:
        product_id = int(payload.get("product_id"))
        quantity = int(payload.get("quantity", 1))
    except (TypeError, ValueError) as e:
        print(f"DEBUG: payload data invalid. payload={payload}, error={e}, request.body={request.body[:100] if request.body else 'Empty'}")
        return JsonResponse(
            {"status": "error", "message": "Datos inválidos"},
            status=400,
        )

    if quantity <= 0:
        return JsonResponse(
            {"status": "error", "message": "La cantidad debe ser mayor a 0"},
            status=400,
        )

    product = Product.objects.filter(pk=product_id).first()
    if not product:
        return JsonResponse(
            {"status": "error", "message": "Producto no encontrado"},
            status=404,
        )

    try:
        line, _ = request.basket.add_product(product=product, quantity=quantity)
    except Exception as exc:
        print(f"DEBUG: add_product failed: {exc}")
        return JsonResponse(
            {"status": "error", "message": str(exc)},
            status=400,
        )

    _refresh_basket_state(request.basket)
    return JsonResponse(
        {
            "status": "ok",
            "line_id": line.id,
            "basket": _serialize_basket(request),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def cart_item_detail_api(request, line_id: int):
    line = _basket_line_or_404(request, line_id)

    if request.method == "DELETE":
        line.delete()
        _refresh_basket_state(request.basket)
        return JsonResponse({"status": "ok", "basket": _serialize_basket(request)})

    payload = _load_payload(request)
    try:
        quantity = int(payload.get("quantity"))
    except (TypeError, ValueError):
        return JsonResponse(
            {"status": "error", "message": "Cantidad inválida"},
            status=400,
        )

    if quantity <= 0:
        line.delete()
        _refresh_basket_state(request.basket)
        return JsonResponse({"status": "ok", "basket": _serialize_basket(request)})

    purchase_permitted, reason = line.purchase_info.availability.is_purchase_permitted(
        quantity
    )
    if not purchase_permitted:
        return JsonResponse(
            {"status": "error", "message": reason or "Stock insuficiente"},
            status=400,
        )

    line.quantity = quantity
    line.save(update_fields=["quantity"])
    _refresh_basket_state(request.basket)
    return JsonResponse({"status": "ok", "basket": _serialize_basket(request)})
