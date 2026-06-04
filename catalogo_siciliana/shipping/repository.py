from oscar.apps.shipping import repository as core_repository

from .methods import DistanceBased, DomicilioExpress, DomicilioNormal


class Repository(core_repository.Repository):
    def get_available_shipping_methods(self, basket, shipping_addr=None, **kwargs):
        request = kwargs.get("request")
        return [
            DistanceBased(shipping_addr=shipping_addr, request=request),
            DomicilioNormal(),
            DomicilioExpress(),
        ]
