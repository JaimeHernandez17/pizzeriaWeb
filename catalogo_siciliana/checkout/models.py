from django.conf import settings
from django.db import models

from oscar.core.loading import get_model

Basket = get_model("basket", "Basket")


class PendingWompiPayment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_DECLINED = "declined"
    STATUS_ERROR = "error"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_DECLINED, "Declined"),
        (STATUS_ERROR, "Error"),
    )

    reference = models.CharField(max_length=64, unique=True)
    basket = models.ForeignKey(Basket, on_delete=models.PROTECT)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    guest_email = models.EmailField(blank=True)
    amount_in_cents = models.BigIntegerField()
    currency = models.CharField(max_length=8, default="COP")
    shipping_address = models.JSONField()
    shipping_method_code = models.CharField(max_length=128)
    status = models.CharField(
        max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    wompi_transaction_id = models.CharField(max_length=128, blank=True)
    wompi_payment_method_type = models.CharField(max_length=64, blank=True)
    wompi_status = models.CharField(max_length=32, blank=True)
    order_number = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} ({self.status})"


class PendingMercadoPagoPayment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_DECLINED = "declined"
    STATUS_ERROR = "error"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_DECLINED, "Declined"),
        (STATUS_ERROR, "Error"),
    )

    reference = models.CharField(max_length=64, unique=True)
    basket = models.ForeignKey(Basket, on_delete=models.PROTECT)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    guest_email = models.EmailField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="COP")
    shipping_address = models.JSONField()
    shipping_method_code = models.CharField(max_length=128)
    status = models.CharField(
        max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    preference_id = models.CharField(max_length=128, blank=True)
    init_point = models.URLField(blank=True)
    payment_id = models.CharField(max_length=128, blank=True)
    payment_status = models.CharField(max_length=32, blank=True)
    payment_status_detail = models.CharField(max_length=128, blank=True)
    order_number = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} ({self.status})"
