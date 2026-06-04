from django.db import models
from django.utils.translation import gettext_lazy as _


class City(models.Model):
    name = models.CharField(_("City"), max_length=128, unique=True)
    is_active = models.BooleanField(_("Is active"), default=True)

    class Meta:
        verbose_name = _("City")
        verbose_name_plural = _("Cities")
        ordering = ["name"]

    def __str__(self):
        return self.name
