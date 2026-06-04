from abc import ABC, abstractmethod
from oscar.core.loading import get_model
from decimal import Decimal

# Cargar modelos dinámicamente según la arquitectura de Oscar
ShippingAddress = get_model("order", "ShippingAddress")
SourceType = get_model("payment", "SourceType")
Source = get_model("payment", "Source")
PaymentEventType = get_model("order", "PaymentEventType")
PaymentEvent = get_model("order", "PaymentEvent")
PaymentEventQuantity = get_model("order", "PaymentEventQuantity")
Order = get_model("order", "Order")
Basket = get_model("basket", "Basket")

class ICheckoutRepository(ABC):
    @abstractmethod
    def create_shipping_address(self, address_data: dict):
        pass

    @abstractmethod
    def get_or_create_source_type(self, name: str):
        pass

    @abstractmethod
    def create_source(self, order, source_type, currency: str, amount_allocated: Decimal, amount_debited: Decimal, reference: str, label: str):
        pass

    @abstractmethod
    def build_source(self, source_type, currency: str, amount_allocated: Decimal, amount_debited: Decimal, reference: str, label: str):
        pass

    @abstractmethod
    def get_or_create_payment_event_type(self, name: str):
        pass

    @abstractmethod
    def create_payment_event(self, order, event_type, amount: Decimal, reference: str):
        pass

    @abstractmethod
    def create_payment_event_quantity(self, event, line, quantity: int):
        pass

    @abstractmethod
    def create_pending_wompi_payment(self, **kwargs):
        pass

    @abstractmethod
    def create_pending_mercadopago_payment(self, **kwargs):
        pass

    @abstractmethod
    def get_pending_wompi_payment(self, reference: str):
        pass

    @abstractmethod
    def get_pending_mercadopago_payment(self, reference: str):
        pass

    @abstractmethod
    def get_pending_wompi_payment_for_update(self, reference: str):
        pass

    @abstractmethod
    def get_pending_mercadopago_payment_for_update(self, reference: str):
        pass

    @abstractmethod
    def get_pending_wompi_payment_by_transaction_id_for_update(self, transaction_id: str):
        pass

    @abstractmethod
    def get_pending_mercadopago_payment_by_payment_id_for_update(self, payment_id: str):
        pass

    @abstractmethod
    def get_pending_mercadopago_payment_by_preference_id_for_update(self, preference_id: str):
        pass

    @abstractmethod
    def get_active_pending_wompi_payment(self, basket):
        pass

    @abstractmethod
    def get_active_pending_mercadopago_payment(self, basket):
        pass

    @abstractmethod
    def get_order_by_number(self, number: str):
        pass

    @abstractmethod
    def search_orders(self, query: str):
        pass

    @abstractmethod
    def get_current_site(self):
        pass

    @abstractmethod
    def save_pending_payment(self, pending_payment, update_fields=None):
        pass

class DjangoCheckoutRepository(ICheckoutRepository):
    def create_shipping_address(self, address_data: dict):
        # Normaliza nombres para soportar payloads con field.name y/o field.attname.
        # Ejemplo: country (name) vs country_id (attname).
        address_fields = {}
        for field in ShippingAddress._meta.fields:
            if field.attname in address_data:
                address_fields[field.attname] = address_data[field.attname]
                continue

            if field.name not in address_data:
                continue

            value = address_data[field.name]
            if field.is_relation:
                value = getattr(value, "pk", value)
                address_fields[field.attname] = value
            else:
                address_fields[field.name] = value

        shipping_address = ShippingAddress(**address_fields)
        shipping_address.save()
        return shipping_address

    def get_or_create_source_type(self, name: str):
        source_type, _ = SourceType.objects.get_or_create(name=name)
        return source_type

    def create_source(self, order, source_type, currency: str, amount_allocated: Decimal, amount_debited: Decimal, reference: str, label: str):
        source = self.build_source(
            source_type=source_type,
            currency=currency,
            amount_allocated=amount_allocated,
            amount_debited=amount_debited,
            reference=reference,
            label=label,
        )
        source.order = order
        source.save()
        return source

    def build_source(self, source_type, currency: str, amount_allocated: Decimal, amount_debited: Decimal, reference: str, label: str):
        return Source(
            source_type=source_type,
            currency=currency,
            amount_allocated=amount_allocated,
            amount_debited=amount_debited,
            reference=reference,
            label=label,
        )

    def get_or_create_payment_event_type(self, name: str):
        event_type, _ = PaymentEventType.objects.get_or_create(name=name)
        return event_type

    def create_payment_event(self, order, event_type, amount: Decimal, reference: str):
        event = PaymentEvent(
            order=order,
            event_type=event_type,
            amount=amount,
            reference=reference,
        )
        event.save()
        return event

    def create_payment_event_quantity(self, event, line, quantity: int):
        return PaymentEventQuantity.objects.create(
            event=event, line=line, quantity=quantity
        )

    def create_pending_wompi_payment(self, **kwargs):
        from .models import PendingWompiPayment
        return PendingWompiPayment.objects.create(**kwargs)

    def create_pending_mercadopago_payment(self, **kwargs):
        from .models import PendingMercadoPagoPayment
        return PendingMercadoPagoPayment.objects.create(**kwargs)

    def get_pending_wompi_payment(self, reference: str):
        from .models import PendingWompiPayment
        return PendingWompiPayment.objects.filter(reference=reference).first()

    def get_pending_mercadopago_payment(self, reference: str):
        from .models import PendingMercadoPagoPayment
        return PendingMercadoPagoPayment.objects.filter(reference=reference).first()

    def get_pending_wompi_payment_for_update(self, reference: str):
        from .models import PendingWompiPayment
        return (
            PendingWompiPayment.objects.select_for_update()
            .select_related("basket", "user")
            .filter(reference=reference)
            .first()
        )

    def get_pending_mercadopago_payment_for_update(self, reference: str):
        from .models import PendingMercadoPagoPayment
        return (
            PendingMercadoPagoPayment.objects.select_for_update()
            .select_related("basket", "user")
            .filter(reference=reference)
            .first()
        )

    def get_pending_wompi_payment_by_transaction_id_for_update(self, transaction_id: str):
        from .models import PendingWompiPayment
        return (
            PendingWompiPayment.objects.select_for_update()
            .select_related("basket", "user")
            .filter(wompi_transaction_id=transaction_id)
            .first()
        )

    def get_pending_mercadopago_payment_by_payment_id_for_update(self, payment_id: str):
        from .models import PendingMercadoPagoPayment
        return (
            PendingMercadoPagoPayment.objects.select_for_update()
            .filter(payment_id=payment_id)
            .first()
        )

    def get_pending_mercadopago_payment_by_preference_id_for_update(self, preference_id: str):
        from .models import PendingMercadoPagoPayment
        return (
            PendingMercadoPagoPayment.objects.select_for_update()
            .filter(preference_id=preference_id)
            .first()
        )

    def get_active_pending_wompi_payment(self, basket):
        from .models import PendingWompiPayment
        return (
            PendingWompiPayment.objects.filter(
                basket=basket, status=PendingWompiPayment.STATUS_PENDING
            )
            .order_by("-created_at")
            .first()
        )

    def get_active_pending_mercadopago_payment(self, basket):
        from .models import PendingMercadoPagoPayment
        return (
            PendingMercadoPagoPayment.objects.filter(
                basket=basket, status=PendingMercadoPagoPayment.STATUS_PENDING, init_point__gt=""
            )
            .order_by("-created_at")
            .first()
        )

    def get_order_by_number(self, number: str):
        return Order.objects.filter(number=number).first()

    def search_orders(self, query: str):
        from django.db import models
        return Order.objects.filter(
            models.Q(guest_email__iexact=query) | 
            models.Q(user__email__iexact=query) |
            models.Q(shipping_address__phone_number__contains=query)
        ).order_by("-date_placed")

    def get_current_site(self):
        from django.contrib.sites.models import Site
        return Site.objects.get_current()

    def save_pending_payment(self, pending_payment, update_fields=None):
        pending_payment.save(update_fields=update_fields)
        return pending_payment
