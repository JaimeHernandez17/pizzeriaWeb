from django import forms

from oscar.apps.checkout import forms as core_forms
from oscar.core.loading import get_model

from catalogo_siciliana.locations.models import City

Country = get_model("address", "Country")


class ShippingAddressForm(core_forms.ShippingAddressForm):
    def adjust_country_field(self):
        if "country" not in self.fields:
            return
        super().adjust_country_field()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("country", None)
        self.fields.pop("state", None)
        self.fields.pop("line4", None)
        self.fields["city"] = forms.ModelChoiceField(
            queryset=City.objects.filter(is_active=True),
            required=True,
            label="Ciudad",
            empty_label=None,
            error_messages={
                "invalid_choice": "Solo está disponible Cartagena.",
                "required": "Selecciona una ciudad.",
            },
        )
        self.order_fields(
            [
                "first_name",
                "last_name",
                "line1",
                "line2",
                "city",
                "phone_number",
                "notes",
            ]
        )
        if "postcode" in self.fields:
            self.fields["postcode"].required = False
        self.fields["line1"].label = "Dirección"
        self.fields["line2"].label = "Punto de referencia"
        self.instance.__class__.POSTCODE_REQUIRED = False
        self.instance.country = self.get_default_country()
        self._sync_city_initial()

    def _sync_city_initial(self):
        if self.instance.line4:
            city = City.objects.filter(name__iexact=self.instance.line4).first()
            if city:
                self.fields["city"].initial = city

    def clean(self):
        cleaned = super().clean()
        city = cleaned.get("city")
        if city:
            self.instance.line4 = city.name
        return cleaned

    def get_default_country(self):
        if not self.instance.country_id:
            try:
                self.instance.country = Country.objects.get(iso_3166_1_a2="CO")
            except Country.DoesNotExist:
                try:
                    self.instance.country = Country.objects.get(
                        printable_name__iexact="Colombia"
                    )
                except Country.DoesNotExist:
                    pass
        return self.instance.country

    class Meta(core_forms.ShippingAddressForm.Meta):
        fields = [
            "first_name",
            "last_name",
            "line1",
            "line2",
            "phone_number",
            "notes",
        ]


class PaymentMethodForm(forms.Form):
    METHOD_WOMPI = "wompi"
    METHOD_MERCADOPAGO = "mercadopago"
    METHOD_COD = "cod"

    payment_method = forms.ChoiceField(
        label="Método de pago",
        choices=(
            (METHOD_WOMPI, "Pagar en línea (PSE, tarjeta, Nequi/Daviplata)"),
            (METHOD_MERCADOPAGO, "Mercado Pago (tarjeta y otros medios)"),
            (METHOD_COD, "Contraentrega"),
        ),
        widget=forms.RadioSelect,
    )
