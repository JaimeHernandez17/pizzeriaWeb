import math
from decimal import Decimal as D

from django.conf import settings

from oscar.apps.shipping import methods as core_methods
from oscar.core import prices


class DomicilioNormal(core_methods.FixedPrice):
    code = "domicilio-normal"
    name = "Domicilio normal"
    charge_excl_tax = D("7000")
    charge_incl_tax = D("7000")


class DomicilioExpress(core_methods.FixedPrice):
    code = "domicilio-express"
    name = "Domicilio express"
    charge_excl_tax = D("12000")
    charge_incl_tax = D("12000")


class DistanceBased(core_methods.Base):
    code = "domicilio-distancia"
    name = "Domicilio por distancia"
    description = "Costo calculado por distancia"

    def __init__(self, shipping_addr=None, request=None):
        self.shipping_addr = shipping_addr
        self.request = request

    def calculate(self, basket):
        base_price = D(str(getattr(settings, "SHIPPING_BASE_PRICE", "7000")))
        per_km = D(str(getattr(settings, "SHIPPING_PRICE_PER_KM", "1000")))
        min_price = D(str(getattr(settings, "SHIPPING_MIN_PRICE", base_price)))

        origin = self._get_pizzeria_coords()
        dest = self._get_destination_coords()
        if not origin or not dest:
            charge = base_price
        else:
            km = self._haversine_km(origin[0], origin[1], dest[0], dest[1])
            charge = base_price + (per_km * D(str(km)))
            if charge < min_price:
                charge = min_price

        return prices.Price(currency=basket.currency, excl_tax=charge, tax=D("0.00"))

    def _get_pizzeria_coords(self):
        coords = getattr(settings, "PIZZERIA_COORDS", None)
        if not coords:
            return None
        lat = coords.get("lat")
        lng = coords.get("lng")
        if lat is None or lng is None:
            return None
        return float(lat), float(lng)

    def _get_destination_coords(self):
        for lat_attr, lng_attr in (("lat", "lng"), ("latitude", "longitude")):
            lat = getattr(self.shipping_addr, lat_attr, None)
            lng = getattr(self.shipping_addr, lng_attr, None)
            if lat is not None and lng is not None:
                return float(lat), float(lng)

        if self.request is not None:
            lat = self.request.session.get("shipping_lat")
            lng = self.request.session.get("shipping_lng")
            if lat is not None and lng is not None:
                return float(lat), float(lng)

        return None

    def _haversine_km(self, lat1, lon1, lat2, lon2):
        radius_km = 6371.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius_km * c
