from django.contrib import admin
from oscar.core.loading import get_model

from .models import PendingMercadoPagoPayment, PendingWompiPayment


@admin.register(PendingWompiPayment)
class PendingWompiPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "status",
        "amount_in_cents",
        "currency",
        "order_number",
        "wompi_status",
        "wompi_payment_method_type",
        "created_at",
    )
    list_filter = ("status", "currency", "wompi_status", "created_at")
    search_fields = ("reference", "order_number", "wompi_transaction_id", "guest_email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(PendingMercadoPagoPayment)
class PendingMercadoPagoPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "status",
        "amount",
        "currency",
        "order_number",
        "payment_status",
        "payment_status_detail",
        "created_at",
    )
    list_filter = ("status", "currency", "payment_status", "created_at")
    search_fields = ("reference", "order_number", "payment_id", "guest_email")
    readonly_fields = ("created_at", "updated_at")
