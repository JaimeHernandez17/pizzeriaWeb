from __future__ import annotations

from decimal import Decimal

from django.core.paginator import EmptyPage, Paginator
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.utils.translation import gettext as _

from oscar.core.loading import get_class, get_model

Product = get_model("catalogue", "Product")
ProductReview = get_model("reviews", "ProductReview")
Selector = get_class("partner.strategy", "Selector")


def _serialize_price(request, product) -> dict:
    strategy = Selector().strategy(request=request, user=request.user)
    purchase_info = strategy.fetch_for_product(product)
    price = getattr(purchase_info, "price", None)

    if not price or not getattr(price, "exists", False):
        return {
            "currency": "COP",
            "incl_tax": None,
            "excl_tax": None,
        }

    incl_tax = price.incl_tax if price.incl_tax is not None else price.excl_tax
    excl_tax = price.excl_tax if price.excl_tax is not None else incl_tax
    return {
        "currency": price.currency,
        "incl_tax": str(Decimal(incl_tax).quantize(Decimal("0.01"))),
        "excl_tax": str(Decimal(excl_tax).quantize(Decimal("0.01"))),
    }


def _serialize_review(review) -> dict:
    return {
        "id": review.id,
        "title": review.title,
        "body": review.body,
        "score": review.score,
        "name": review.reviewer_name,
        "date_created": review.date_created.isoformat(),
    }


def _serialize_product(request, product) -> dict:
    image = product.primary_image()
    image_url = ""
    if image and getattr(image, "original", None):
        image_url = request.build_absolute_uri(image.original.url)

    return {
        "id": product.id,
        "title": product.title,
        "slug": product.slug,
        "description": product.description or "",
        "url": product.get_absolute_url(),
        "image_url": image_url,
        "price": _serialize_price(request, product),
        "attributes": [
            {"name": av.attribute.name, "value": av.value_as_text}
            for av in product.attribute_values.all()
        ],
        "upc": product.upc,
        "availability": product.stockrecords.first().num_in_stock > 0 if product.stockrecords.exists() else False,
    }


def _serialize_variant(request, product) -> dict:
    return {
        "id": product.id,
        "title": product.title,
        "slug": product.slug,
        "price": _serialize_price(request, product),
        "availability": product.stockrecords.first().num_in_stock > 0 if product.stockrecords.exists() else False,
        "attributes": [
            {"name": av.attribute.name, "value": av.value_as_text}
            for av in product.attribute_values.all()
        ],
    }


@require_GET
def product_detail_api(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)

    data = _serialize_product(request, product)

    if product.is_parent:
        data["variants"] = [
            _serialize_variant(request, variant)
            for variant in product.children.all()
        ]

    # Include reviews
    reviews = ProductReview.objects.approved().filter(product=product).order_by("-date_created")
    data["reviews"] = [_serialize_review(review) for review in reviews]

    return JsonResponse(data)


from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def submit_review_api(request, product_id):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found"}, status=404)

    try:
        data = json.loads(request.body)
        title = data.get("title", "Reseña de producto")
        body = data.get("body")
        score = int(data.get("score", 5))
        name = data.get("name", "Anónimo")

        if not body:
            return JsonResponse({"error": "El cuerpo de la reseña es obligatorio"}, status=400)

        review = ProductReview(
            product=product,
            title=title,
            body=body,
            score=score,
            name=name,
            status=ProductReview.APPROVED # Auto-approve for this project as per common requirement in simple sites, or keep as default
        )
        if request.user.is_authenticated:
            review.user = request.user
        review.save()

        return JsonResponse(_serialize_review(review), status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@require_GET
def catalogue_products_api(request):
    query = request.GET.get("q", "").strip()

    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1

    try:
        page_size = int(request.GET.get("page_size", 12))
    except (TypeError, ValueError):
        page_size = 12
    page_size = max(1, min(page_size, 40))

    products_qs = Product.objects.browsable().base_queryset()
    if query:
        products_qs = products_qs.filter(title__icontains=query)

    products_qs = products_qs.order_by("title")
    paginator = Paginator(products_qs, page_size)

    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages if paginator.num_pages else 1)

    items = [_serialize_product(request, product) for product in page_obj.object_list]

    return JsonResponse(
        {
            "items": items,
            "pagination": {
                "page": page_obj.number,
                "page_size": page_obj.paginator.per_page,
                "total_items": page_obj.paginator.count,
                "total_pages": page_obj.paginator.num_pages,
            },
            "query": query,
            "summary": _("All products"),
        }
    )
