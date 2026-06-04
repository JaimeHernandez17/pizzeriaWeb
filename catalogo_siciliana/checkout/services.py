from abc import ABC, abstractmethod
from decimal import Decimal
import logging
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import mercadopago
from django.conf import settings
from django.db import transaction
from django.urls import reverse
from django.utils.translation import gettext as _

from oscar.apps.payment import exceptions as payment_exceptions
from oscar.core.loading import get_class

from .repositories import DjangoCheckoutRepository, ICheckoutRepository
from .utils import (
    _amount_to_cents,
    _assign_strategy,
    _build_reference,
    _build_reference_with_prefix,
    _build_wompi_signature,
    _is_valid_mercadopago_signature,
    _is_valid_wompi_event,
    _serialize_address,
    _thaw_basket,
)

Repository = get_class("shipping.repository", "Repository")
OrderTotalCalculator = get_class("checkout.calculators", "OrderTotalCalculator")
OrderNumberGenerator = get_class("order.utils", "OrderNumberGenerator")
OrderCreator = get_class("order.utils", "OrderCreator")
OrderDispatcher = get_class("order.utils", "OrderDispatcher")
logger = logging.getLogger(__name__)


class IPaymentService(ABC):
    @abstractmethod
    def get_redirect_url(
        self,
        basket,
        total,
        shipping_address,
        shipping_method,
        guest_email: str,
        request=None,
    ) -> str:
        pass

    @abstractmethod
    def handle_webhook(
        self,
        payload: Dict[str, Any],
        query_params: Optional[Dict[str, Any]] = None,
        body: Optional[bytes] = None,
        request=None,
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    def handle_return(self, query_params: Dict[str, Any]) -> Dict[str, Any]:
        pass


class OrderService:
    def __init__(self, repository: Optional[ICheckoutRepository] = None):
        self.repository = repository or DjangoCheckoutRepository()

    def place_order_from_pending_payment(
        self,
        pending_payment,
        payment_data: Dict[str, Any],
        payment_method: str,
    ) -> bool:
        basket = pending_payment.basket
        user = pending_payment.user

        shipping_address = self.repository.create_shipping_address(
            pending_payment.shipping_address
        )
        shipping_method = self._get_shipping_method_by_code(
            pending_payment.shipping_method_code, basket, shipping_address, user
        )
        if not shipping_method:
            return False

        shipping_charge = shipping_method.calculate(basket)
        order_total = OrderTotalCalculator().calculate(basket, shipping_charge)
        if not self._validate_paid_amount(
            order_total, pending_payment, payment_data, payment_method
        ):
            return False

        order_number = OrderNumberGenerator().order_number(basket)
        order = OrderCreator().place_order(
            user=user,
            basket=basket,
            shipping_address=shipping_address,
            shipping_method=shipping_method,
            shipping_charge=shipping_charge,
            total=order_total,
            order_number=order_number,
            status="Pagado",
            guest_email=pending_payment.guest_email,
        )
        basket.submit()

        self._register_payment(order, pending_payment, payment_data, payment_method)
        self._send_order_email(order, user)

        pending_payment.order_number = order.number
        self.repository.save_pending_payment(pending_payment)
        return True

    def _get_shipping_method_by_code(self, code, basket, shipping_address, user):
        _assign_strategy(basket, user)
        methods = Repository().get_shipping_methods(
            basket=basket,
            user=user,
            shipping_addr=shipping_address,
            request=None,
        )
        for method in methods:
            if method.code == code:
                return method
        return None

    def _validate_paid_amount(
        self,
        order_total,
        pending_payment,
        payment_data: Dict[str, Any],
        payment_method: str,
    ) -> bool:
        if order_total.incl_tax is None:
            return False

        if payment_method == "wompi":
            paid_cents = payment_data.get("amount_in_cents")
            if paid_cents is None:
                return False
            expected_cents = _amount_to_cents(order_total.incl_tax)
            return (
                expected_cents == pending_payment.amount_in_cents
                and expected_cents == int(paid_cents)
            )

        if payment_method == "mercadopago":
            paid_amount = payment_data.get("transaction_amount")
            if paid_amount is None:
                return False
            return Decimal(str(paid_amount)) == order_total.incl_tax

        return False

    def _register_payment(self, order, pending_payment, payment_data, payment_method: str):
        if payment_method == "wompi":
            provider_name = "Wompi"
            reference = pending_payment.wompi_transaction_id
            label = pending_payment.wompi_payment_method_type
        else:
            provider_name = "Mercado Pago"
            reference = str(payment_data.get("id", ""))
            label = payment_data.get("payment_method_id") or payment_data.get(
                "payment_type_id", ""
            )

        source_type = self.repository.get_or_create_source_type(name=provider_name)
        self.repository.create_source(
            order=order,
            source_type=source_type,
            currency=order.currency,
            amount_allocated=order.total_incl_tax,
            amount_debited=order.total_incl_tax,
            reference=reference,
            label=label,
        )

        event_type = self.repository.get_or_create_payment_event_type(
            name="Pago confirmado"
        )
        event = self.repository.create_payment_event(
            order=order,
            event_type=event_type,
            amount=order.total_incl_tax,
            reference=reference,
        )
        for line in order.lines.all():
            self.repository.create_payment_event_quantity(
                event=event,
                line=line,
                quantity=line.quantity,
            )

    def _send_order_email(self, order, user):
        sender = (
            (getattr(settings, "OSCAR_FROM_EMAIL", "") or "").strip()
            or (getattr(settings, "DEFAULT_FROM_EMAIL", "") or "").strip()
        )
        if not sender:
            logger.warning(
                "Checkout email skipped for order %s: sender email is empty",
                order.number,
            )
            return

        dispatcher = OrderDispatcher()
        context = {
            "user": user,
            "order": order,
            "lines": order.lines.all(),
            "request": None,
        }

        try:
            if user and user.is_authenticated:
                path = reverse("customer:order", kwargs={"order_number": order.number})
            else:
                path = reverse(
                    "customer:anon-order",
                    kwargs={
                        "order_number": order.number,
                        "hash": order.verification_hash(),
                    },
                )
            site = self.repository.get_current_site()
            context["status_path"] = path
            context["status_url"] = f"http://{site.domain}{path}"
        except Exception:
            pass

        try:
            dispatcher.send_order_placed_email_for_user(order, context)
        except Exception:
            logger.exception(
                "Checkout email failed for order %s; order remains created",
                order.number,
            )


class CashOnDeliveryService:
    def __init__(self, repository: Optional[ICheckoutRepository] = None):
        self.repository = repository or DjangoCheckoutRepository()

    def build_source(self, total):
        source_type = self.repository.get_or_create_source_type(name="Contraentrega")
        return self.repository.build_source(
            source_type=source_type,
            currency=total.currency,
            amount_allocated=total.incl_tax,
            amount_debited=Decimal("0.00"),
            reference="COD",
            label="Contraentrega",
        )


class WompiService(IPaymentService):
    def __init__(
        self,
        repository: Optional[ICheckoutRepository] = None,
        order_service: Optional[OrderService] = None,
    ):
        self.repository = repository or DjangoCheckoutRepository()
        self.order_service = order_service or OrderService(self.repository)

    def get_redirect_url(
        self,
        basket,
        total,
        shipping_address,
        shipping_method,
        guest_email: str,
        request=None,
    ) -> str:
        if not settings.WOMPI_PUBLIC_KEY or not settings.WOMPI_INTEGRITY_SECRET:
            raise payment_exceptions.UnableToTakePayment(
                _("Wompi no está configurado correctamente.")
            )

        amount_in_cents = _amount_to_cents(total.incl_tax)
        existing = self.repository.get_active_pending_wompi_payment(basket)

        if existing and existing.amount_in_cents == amount_in_cents:
            reference = existing.reference
        else:
            reference = _build_reference(basket.id)
            self.repository.create_pending_wompi_payment(
                reference=reference,
                basket=basket,
                user=basket.owner
                if basket.owner and basket.owner.is_authenticated
                else None,
                guest_email=guest_email,
                amount_in_cents=amount_in_cents,
                currency=settings.WOMPI_CURRENCY,
                shipping_address=_serialize_address(shipping_address),
                shipping_method_code=shipping_method.code,
            )

        params = {
            "public-key": settings.WOMPI_PUBLIC_KEY,
            "currency": settings.WOMPI_CURRENCY,
            "amount-in-cents": amount_in_cents,
            "reference": reference,
            "signature:integrity": _build_wompi_signature(
                reference=reference,
                amount_in_cents=amount_in_cents,
                currency=settings.WOMPI_CURRENCY,
                integrity_secret=settings.WOMPI_INTEGRITY_SECRET,
            ),
            "redirect-url": self._build_public_return_url(request),
        }

        checkout_url = settings.WOMPI_CHECKOUT_URL
        separator = "&" if "?" in checkout_url else "?"
        return f"{checkout_url}{separator}{urlencode(params)}"

    def handle_webhook(
        self,
        payload: Dict[str, Any],
        query_params: Optional[Dict[str, Any]] = None,
        body: Optional[bytes] = None,
        request=None,
    ) -> Dict[str, Any]:
        if not _is_valid_wompi_event(payload):
            return {"status": "error", "message": "Invalid signature"}

        if payload.get("event") != "transaction.updated":
            return {"status": "ignored"}

        transaction_data = (payload.get("data") or {}).get("transaction") or {}
        return self._process_transaction(transaction_data)

    def handle_return(self, query_params: Dict[str, Any]) -> Dict[str, Any]:
        transaction_id = query_params.get("id")
        if not transaction_id:
            return {}

        with transaction.atomic():
            pending = (
                self.repository.get_pending_wompi_payment_by_transaction_id_for_update(
                    transaction_id
                )
            )
            if not pending:
                return {}

            if pending.order_number:
                return {"order_number": pending.order_number}

            if pending.wompi_status == "APPROVED":
                created = self.order_service.place_order_from_pending_payment(
                    pending,
                    {"amount_in_cents": pending.amount_in_cents},
                    "wompi",
                )
                if created:
                    pending.status = "approved"
                    self.repository.save_pending_payment(pending)
                return {"order_number": pending.order_number}

        return {}

    def _process_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        reference = transaction_data.get("reference")
        if not reference:
            return {"status": "error", "message": "No reference"}

        with transaction.atomic():
            pending = self.repository.get_pending_wompi_payment_for_update(reference)
            if not pending:
                return {"status": "missing"}

            pending.wompi_status = transaction_data.get("status", "") or ""
            pending.wompi_transaction_id = transaction_data.get("id", "") or ""
            pending.wompi_payment_method_type = (
                transaction_data.get("payment_method_type", "") or ""
            )

            status = transaction_data.get("status")
            if status == "APPROVED":
                if pending.order_number:
                    pending.status = "approved"
                else:
                    created = self.order_service.place_order_from_pending_payment(
                        pending,
                        transaction_data,
                        "wompi",
                    )
                    pending.status = "approved" if created else "error"
            elif status in {"DECLINED", "VOIDED", "ERROR"}:
                pending.status = "declined"
                _thaw_basket(pending.basket)

            self.repository.save_pending_payment(pending)

        return {"status": "ok"}

    def _build_public_return_url(self, request=None) -> str:
        path = reverse("wompi-return")
        base_url = getattr(settings, "WOMPI_PUBLIC_BASE_URL", "").strip()
        if base_url:
            return f"{base_url.rstrip('/')}{path}"
        if request is not None:
            return request.build_absolute_uri(path)
        return path


class MercadoPagoService(IPaymentService):
    def __init__(
        self,
        repository: Optional[ICheckoutRepository] = None,
        order_service: Optional[OrderService] = None,
    ):
        self.repository = repository or DjangoCheckoutRepository()
        self.order_service = order_service or OrderService(self.repository)

    def get_redirect_url(
        self,
        basket,
        total,
        shipping_address,
        shipping_method,
        guest_email: str,
        request=None,
    ) -> str:
        if not settings.MERCADOPAGO_ACCESS_TOKEN:
            raise payment_exceptions.UnableToTakePayment(
                _("Mercado Pago no está configurado correctamente.")
            )
        if request is None:
            raise payment_exceptions.UnableToTakePayment(
                _("No se pudo preparar el pago con Mercado Pago.")
            )

        existing = self.repository.get_active_pending_mercadopago_payment(basket)
        if existing:
            request.session["mercadopago_init_point"] = existing.init_point
            request.session["mercadopago_reference"] = existing.reference
            return reverse("mercadopago-waiting")

        reference = _build_reference_with_prefix("mp", basket.id)
        preference = self._create_preference(
            reference=reference,
            amount=total.incl_tax,
            currency=settings.MERCADOPAGO_CURRENCY,
            request=request,
            payer_email=guest_email,
        )
        if "error" in preference:
            raise payment_exceptions.UnableToTakePayment(preference["error"])

        self.repository.create_pending_mercadopago_payment(
            reference=reference,
            basket=basket,
            user=basket.owner if basket.owner and basket.owner.is_authenticated else None,
            guest_email=guest_email,
            amount=total.incl_tax,
            currency=settings.MERCADOPAGO_CURRENCY,
            shipping_address=_serialize_address(shipping_address),
            shipping_method_code=shipping_method.code,
            preference_id=preference.get("id", ""),
            init_point=preference.get("init_point", ""),
        )

        request.session["mercadopago_init_point"] = preference.get("init_point", "")
        request.session["mercadopago_reference"] = reference
        return reverse("mercadopago-waiting")

    def handle_webhook(
        self,
        payload: Dict[str, Any],
        query_params: Optional[Dict[str, Any]] = None,
        body: Optional[bytes] = None,
        request=None,
    ) -> Dict[str, Any]:
        if request is None or not _is_valid_mercadopago_signature(request, body or b""):
            return {"status": "error", "message": "Invalid signature"}

        payment_id = ((payload.get("data") or {}).get("id")) or (
            (query_params or {}).get("id")
        )
        if not payment_id:
            return {"status": "error", "message": "No payment ID"}

        payment = self._fetch_payment(payment_id)
        if "error" in payment:
            return {"status": "error", "message": payment["error"]}

        return self._process_payment(payment)

    def handle_return(self, query_params: Dict[str, Any]) -> Dict[str, Any]:
        status = query_params.get("status") or query_params.get("collection_status")
        payment_id = query_params.get("payment_id") or query_params.get("collection_id")
        if not payment_id:
            return {"status": status}

        with transaction.atomic():
            pending = self.repository.get_pending_mercadopago_payment_by_payment_id_for_update(
                payment_id
            )
            if not pending:
                preference_id = query_params.get("preference_id")
                if preference_id:
                    pending = self.repository.get_pending_mercadopago_payment_by_preference_id_for_update(
                        preference_id
                    )

            if not pending:
                return {"status": status, "payment_id": payment_id}

            if pending.order_number:
                return {
                    "status": status,
                    "order_number": pending.order_number,
                    "payment_id": payment_id,
                }

            if status in {"approved", "success"}:
                payment = self._fetch_payment(payment_id)
                if "error" not in payment:
                    self._update_pending_model(pending, payment)
                    if payment.get("status") == "approved":
                        created = self.order_service.place_order_from_pending_payment(
                            pending,
                            payment,
                            "mercadopago",
                        )
                        pending.status = "approved" if created else "error"
                        self.repository.save_pending_payment(pending)
            elif status in {"rejected", "cancelled"}:
                pending.status = "declined"
                pending.payment_status = status
                self.repository.save_pending_payment(pending)
                _thaw_basket(pending.basket)

            return {
                "status": status,
                "order_number": pending.order_number,
                "payment_id": payment_id,
            }

    def _create_preference(
        self,
        reference: str,
        amount,
        currency: str,
        request,
        payer_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        amount_value = float(Decimal(amount).quantize(Decimal("0.01")))

        back_url = self._build_absolute_uri(
            request,
            reverse("mercadopago-return"),
            require_https=True,
        )
        notification_url = self._build_absolute_uri(
            request,
            reverse("mercadopago-webhook"),
            require_https=True,
        )

        preference_data = {
            "items": [
                {
                    "title": "Pedido Pizzeria",
                    "quantity": 1,
                    "currency_id": currency,
                    "unit_price": amount_value,
                }
            ],
            "external_reference": reference,
            "back_urls": {
                "success": back_url,
                "pending": back_url,
                "failure": back_url,
            },
            "notification_url": notification_url,
            "auto_return": "approved",
        }
        if payer_email:
            preference_data["payer"] = {"email": payer_email}

        result = sdk.preference().create(preference_data)
        if result["status"] >= 400:
            return {"error": f"HTTP {result['status']}", "error_detail": result["response"]}
        return result["response"]

    def _build_absolute_uri(self, request, path: str, require_https: bool = False) -> str:
        base_url = getattr(settings, "MERCADOPAGO_PUBLIC_BASE_URL", "").strip()
        if base_url:
            url = f"{base_url.rstrip('/')}{path}"
        else:
            url = request.build_absolute_uri(path)

        if require_https and not url.startswith("https://"):
            raise payment_exceptions.UnableToTakePayment(
                "Mercado Pago requiere un URL HTTPS publico. "
                "Configura MERCADOPAGO_PUBLIC_BASE_URL con tu dominio HTTPS."
            )
        return url

    def _process_payment(self, payment: Dict[str, Any]) -> Dict[str, Any]:
        reference = payment.get("external_reference")
        if not reference:
            return {"status": "error", "message": "No reference"}

        with transaction.atomic():
            pending = self.repository.get_pending_mercadopago_payment_for_update(reference)
            if not pending:
                return {"status": "missing"}

            self._update_pending_model(pending, payment)

            status = payment.get("status")
            if status == "approved":
                if pending.order_number:
                    pending.status = "approved"
                else:
                    created = self.order_service.place_order_from_pending_payment(
                        pending,
                        payment,
                        "mercadopago",
                    )
                    pending.status = "approved" if created else "error"
            elif status in {"rejected", "cancelled"}:
                pending.status = "declined"
                _thaw_basket(pending.basket)

            self.repository.save_pending_payment(pending)

        return {"status": "ok"}

    def _update_pending_model(self, pending, payment):
        pending.payment_id = str(payment.get("id", "")) if payment.get("id") else ""
        pending.payment_status = payment.get("status", "") or ""
        pending.payment_status_detail = payment.get("status_detail", "") or ""

    def _fetch_payment(self, payment_id) -> Dict[str, Any]:
        sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        result = sdk.payment().get(payment_id)
        if result["status"] >= 400:
            return {"error": f"HTTP {result['status']}", "error_detail": result["response"]}
        return result["response"]


class PaymentServiceFactory:
    @staticmethod
    def get_service(method_name: str, repository: Optional[ICheckoutRepository] = None,):
        repository = repository or DjangoCheckoutRepository()
        order_service = OrderService(repository=repository)

        if method_name == "wompi":
            return WompiService(repository=repository, order_service=order_service)
        if method_name == "mercadopago":
            return MercadoPagoService(repository=repository, order_service=order_service,)
        if method_name == "cod":
            return CashOnDeliveryService(repository=repository)

        raise ValueError(f"Unknown payment method: {method_name}")
