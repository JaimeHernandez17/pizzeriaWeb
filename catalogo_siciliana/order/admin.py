from django import forms
from oscar.apps.order.admin import *  # noqa
from django.contrib import admin
from django.conf import settings
from oscar.core.loading import get_model

Order = get_model("order", "Order")
Line = get_model("order", "Line")
OrderNote = get_model("order", "OrderNote")
PaymentEvent = get_model("order", "PaymentEvent")
PaymentEventType = get_model("order", "PaymentEventType")

class OrderForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Extraer estados de la configuración de Oscar
        pipeline = getattr(settings, "OSCAR_ORDER_STATUS_PIPELINE", {})
        # Los estados pueden ser las claves del pipeline + estados de destino que no son origen
        statuses = set(pipeline.keys())
        for targets in pipeline.values():
            statuses.update(targets)
        
        # Si no hay pipeline, usar el estado actual como mínimo
        if self.instance and self.instance.status:
            statuses.add(self.instance.status)
        
        # Ordenar y crear la lista de opciones
        choices = [(s, s) for s in sorted(list(statuses))]
        self.fields['status'].widget = forms.Select(choices=choices)

    class Meta:
        model = Order
        fields = "__all__"

class LineInlineLocal(admin.TabularInline):
    model = Line
    extra = 0
    readonly_fields = (
        "product",
        "quantity",
        "line_price_excl_tax",
        "line_price_incl_tax",
        "line_price_before_discounts_excl_tax",
        "line_price_before_discounts_incl_tax",
    )

class OrderNoteInlineLocal(admin.TabularInline):
    model = OrderNote
    extra = 0

try:
    admin.site.unregister(Order)
except admin.sites.NotRegistered:
    pass

@admin.register(Order)
class OrderAdminLocal(admin.ModelAdmin):
    form = OrderForm
    list_display = (
        "number",
        "total_incl_tax",
        "status",
        "user",
        "date_placed",
    )
    list_filter = ("status", "date_placed")
    search_fields = ("number", "guest_email", "user__email", "user__username")
    readonly_fields = ("number", "total_incl_tax", "total_excl_tax", "shipping_incl_tax", "shipping_excl_tax", "date_placed")
    inlines = [LineInlineLocal, OrderNoteInlineLocal]

try:
    admin.site.unregister(PaymentEvent)
except admin.sites.NotRegistered:
    pass

@admin.register(PaymentEvent)
class PaymentEventAdminLocal(admin.ModelAdmin):
    list_display = ("order", "event_type", "amount", "reference", "date_created")
    list_filter = ("event_type", "date_created")
    search_fields = ("order__number", "reference")

try:
    admin.site.unregister(PaymentEventType)
except admin.sites.NotRegistered:
    pass

@admin.register(PaymentEventType)
class PaymentEventTypeAdminLocal(admin.ModelAdmin):
    list_display = ("name", "code")
