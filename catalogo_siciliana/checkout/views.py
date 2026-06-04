import json

from django.contrib import messages
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.utils.translation import gettext as _
from django.views import generic
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_POST

from oscar.apps.checkout import views as core_views
from oscar.apps.payment import exceptions as payment_exceptions
from oscar.core.loading import get_model

from .forms import PaymentMethodForm, ShippingAddressForm
from .repositories import DjangoCheckoutRepository
from .services import PaymentServiceFactory
from .utils import _thaw_basket

Order = get_model("order", "Order")


@method_decorator(ensure_csrf_cookie, name='dispatch')
class IndexView(core_views.IndexView):
    pass


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ShippingAddressView(core_views.ShippingAddressView):
    form_class = ShippingAddressForm

    def form_valid(self, form):
        address_fields = {}
        for field in form.instance._meta.fields:
            if field.name == "id":
                continue
            address_fields[field.name] = getattr(form.instance, field.name)
        # Oscar's checkout view expects country_id in session data.
        address_fields["country_id"] = form.instance.country_id
        address_fields.pop("country", None)
        self.checkout_session.ship_to_new_address(address_fields)
        return generic.FormView.form_valid(self, form)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ShippingMethodView(core_views.ShippingMethodView):
    def get(self, request, *args, **kwargs):
        if not request.basket.is_shipping_required():
            self.checkout_session.use_shipping_method(
                core_views.NoShippingRequired().code
            )
            return self.get_success_response()

        if not self.checkout_session.is_shipping_address_set():
            messages.error(request, _("Please choose a shipping address"))
            return redirect("checkout:shipping-address")

        self._methods = self.get_available_shipping_methods()
        if len(self._methods) == 0:
            messages.warning(
                request,
                _(
                    "Shipping is unavailable for your chosen address - please "
                    "choose another"
                ),
            )
            return redirect("checkout:shipping-address")

        return generic.FormView.get(self, request, *args, **kwargs)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class PaymentMethodView(core_views.PaymentMethodView):
    template_name = "oscar/checkout/payment_method.html"
    form_class = PaymentMethodForm
    success_url = reverse_lazy("checkout:preview")

    def get(self, request, *args, **kwargs):
        return redirect("checkout:payment-details")

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST)
        if form.is_valid():
            payment_method = form.cleaned_data["payment_method"]
            self.checkout_session.pay_by(payment_method)
            if payment_method == PaymentMethodForm.METHOD_COD:
                _thaw_basket(request.basket)
            return redirect(self.get_success_url())
        return self.render_to_response(self.get_context_data(form=form))


@method_decorator(ensure_csrf_cookie, name='dispatch')
class PaymentDetailsView(core_views.PaymentDetailsView):
    template_name = "oscar/checkout/payment_details.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        initial_method = self.checkout_session.payment_method() or PaymentMethodForm.METHOD_WOMPI
        payment_method_form = kwargs.get("payment_method_form")
        if not payment_method_form:
            payment_method_form = PaymentMethodForm(
                initial={"payment_method": initial_method}
            )
        ctx["payment_method_form"] = payment_method_form
        ctx["selected_payment_method"] = initial_method
        return ctx

    def get(self, request, *args, **kwargs):
        self._get_payment_method()
        if self.preview:
            return self.render_preview(request)
        return self.render_payment_details(request)

    def post(self, request, *args, **kwargs):
        if self.preview:
            return super().post(request, *args, **kwargs)
        form = PaymentMethodForm(request.POST)
        if form.is_valid():
            payment_method = form.cleaned_data["payment_method"]
            self.checkout_session.pay_by(payment_method)
            if payment_method == PaymentMethodForm.METHOD_COD:
                _thaw_basket(request.basket)
            return redirect("checkout:preview")
        ctx = self.get_context_data(payment_method_form=form)
        return self.render_payment_details(request, **ctx)

    def build_submission(self, **kwargs):
        submission = super().build_submission(**kwargs)
        if self._get_payment_method() == PaymentMethodForm.METHOD_COD:
            submission["order_kwargs"]["status"] = "Pendiente de pago"
        return submission

    def handle_payment(self, order_number, total, **kwargs):
        payment_method = self._get_payment_method()
        if payment_method == PaymentMethodForm.METHOD_COD:
            cod_service = PaymentServiceFactory.get_service(payment_method)
            self.add_payment_source(cod_service.build_source(total))
            return

        service = PaymentServiceFactory.get_service(payment_method)

        basket = self.request.basket
        shipping_address = self.get_shipping_address(basket)
        if not shipping_address:
            raise payment_exceptions.UnableToTakePayment(
                _("No se encontró dirección de envío.")
            )

        shipping_method = self.get_shipping_method(basket, shipping_address)
        if not shipping_method:
            raise payment_exceptions.UnableToTakePayment(
                _("No se encontró método de envío válido.")
            )

        guest_email = self.checkout_session.get_guest_email() or ""
        redirect_url = service.get_redirect_url(
            basket=basket,
            total=total,
            shipping_address=shipping_address,
            shipping_method=shipping_method,
            guest_email=guest_email,
            request=self.request,
        )
        raise payment_exceptions.RedirectRequired(redirect_url)

    def _get_payment_method(self):
        payment_method = self.checkout_session.payment_method()
        if payment_method not in (
            PaymentMethodForm.METHOD_WOMPI,
            PaymentMethodForm.METHOD_MERCADOPAGO,
            PaymentMethodForm.METHOD_COD,
        ):
            payment_method = PaymentMethodForm.METHOD_WOMPI
            self.checkout_session.pay_by(payment_method)
        return payment_method


@method_decorator(ensure_csrf_cookie, name='dispatch')
class WompiReturnView(generic.TemplateView):
    template_name = "oscar/checkout/wompi_return.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        service = PaymentServiceFactory.get_service("wompi")
        result = service.handle_return(self.request.GET)
        ctx.update(result)
        return ctx


@method_decorator(ensure_csrf_cookie, name='dispatch')
class MercadoPagoReturnView(generic.TemplateView):
    template_name = "oscar/checkout/mercadopago_return.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        service = PaymentServiceFactory.get_service("mercadopago")
        result = service.handle_return(self.request.GET)
        ctx.update(result)
        return ctx


@method_decorator(ensure_csrf_cookie, name='dispatch')
class MercadoPagoWaitingView(generic.TemplateView):
    template_name = "oscar/checkout/mercadopago_waiting.html"

    def get_context_data(self, **kwargs):
        repo = DjangoCheckoutRepository()
        ctx = super().get_context_data(**kwargs)
        init_point = self.request.session.get("mercadopago_init_point")
        reference = self.request.session.get("mercadopago_reference")
        
        if not init_point or not reference:
            # Si no hay datos en sesión, intentar recuperarlos del último pago pendiente del carrito
            basket = self.request.basket
            pending = repo.get_active_pending_mercadopago_payment(basket)
            if pending:
                init_point = pending.init_point
                reference = pending.reference
        
        ctx["init_point"] = init_point
        ctx["reference"] = reference
        return ctx


@method_decorator(ensure_csrf_cookie, name='dispatch')
class MercadoPagoStatusCheckView(generic.View):
    def get(self, request, *args, **kwargs):
        repo = DjangoCheckoutRepository()
        reference = request.GET.get("reference")
        if not reference:
            return JsonResponse({"status": "error", "message": "No reference provided"}, status=400)
        
        pending = repo.get_pending_mercadopago_payment(reference=reference)
        if pending:
            return JsonResponse({
                "status": pending.status,
                "order_number": pending.order_number
            })
        else:
            return JsonResponse({"status": "not_found"}, status=404)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class ThankYouView(core_views.ThankYouView):
    pass


@method_decorator(ensure_csrf_cookie, name='dispatch')
class OrderTrackingView(generic.DetailView):
    model = Order
    template_name = "oscar/checkout/order_tracking.html"
    context_object_name = "order"
    slug_field = "number"
    slug_url_kwarg = "order_number"

    def get_queryset(self):
        return super().get_queryset().prefetch_related("lines", "lines__product")


@method_decorator(ensure_csrf_cookie, name='dispatch')
class OrderLookupView(generic.View):
    def get(self, request, *args, **kwargs):
        repo = DjangoCheckoutRepository()
        query = request.GET.get("order_number", "").strip()
        if not query:
            return render(request, "oscar/checkout/order_lookup.html")

        # Intentar buscar por número de orden exacto
        order = repo.get_order_by_number(query)
        if order:
            return redirect("order-tracking", order_number=order.number)
            
        # Intentar buscar por correo (usuario registrado o invitado) o teléfono
        orders = repo.search_orders(query)

        count = orders.count()
        if count == 1:
            return redirect("order-tracking", order_number=orders.first().number)
        elif count > 1:
            return render(request, "oscar/checkout/order_list.html", {
                "orders": orders,
                "query": query
            })
        else:
            messages.error(
                request, _("No se encontró ningún pedido que coincida con: %s") % query
            )
            return render(request, "oscar/checkout/order_lookup.html", {"query": query})


@csrf_exempt
@require_POST
def wompi_webhook(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (TypeError, ValueError):
        return HttpResponseBadRequest()

    service = PaymentServiceFactory.get_service("wompi")
    result = service.handle_webhook(payload, body=request.body)
    
    if result.get("status") == "error":
        return HttpResponseBadRequest()
        
    return JsonResponse(result)


@csrf_exempt
@require_POST
def mercadopago_webhook(request):
    raw_body = request.body or b""
    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except (TypeError, ValueError):
        payload = {}

    service = PaymentServiceFactory.get_service("mercadopago")
    result = service.handle_webhook(
        payload,
        query_params=request.GET,
        body=raw_body,
        request=request,
    )
    
    if result.get("status") == "error":
        return HttpResponseBadRequest()
        
    return JsonResponse(result)
