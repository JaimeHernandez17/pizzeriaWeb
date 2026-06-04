from django import forms

from oscar.apps.address import forms as core_forms

from catalogo_siciliana.locations.models import City


class UserAddressForm(core_forms.UserAddressForm):
    def __init__(self, user, *args, **kwargs):
        super().__init__(user, *args, **kwargs)
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
        self.instance.__class__.POSTCODE_REQUIRED = False
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
