import logging
from oscar.apps.order.utils import OrderCreator as CoreOrderCreator
from oscar.apps.order.utils import OrderDispatcher as CoreOrderDispatcher
from oscar.core.loading import get_model, get_class
from django.conf import settings
from django.db import transaction
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)
Order = get_model('order', 'Order')
CommunicationEventType = get_model('communication', 'CommunicationEventType')

class OrderCreator(CoreOrderCreator):
    """
    Custom OrderCreator that prevents ValueError when an order number already exists
    for the same basket. This can happen in race conditions or double submissions.
    """
    def place_order(self, basket, total, shipping_method, shipping_charge,
                    user=None, shipping_address=None, billing_address=None,
                    order_number=None, status=None, request=None, surcharges=None,
                    **kwargs):
        
        if not order_number:
            generator = get_class('order.utils', 'OrderNumberGenerator')()
            order_number = generator.order_number(basket)

        # Check if an order already exists with this number.
        # If it belongs to the same basket, we can safely return it instead of raising an error.
        with transaction.atomic():
            existing_order = Order.objects.filter(number=order_number).first()
            if existing_order:
                if existing_order.basket_id == basket.id:
                    logger.info("Order #%s already exists for basket #%s. Returning existing order.", order_number, basket.id)
                    return existing_order
                # If it's a real collision (different basket), let the core handle it (it will raise ValueError).
        
        return super().place_order(
            basket=basket,
            total=total,
            shipping_method=shipping_method,
            shipping_charge=shipping_charge,
            user=user,
            shipping_address=shipping_address,
            billing_address=billing_address,
            order_number=order_number,
            status=status,
            request=request,
            surcharges=surcharges,
            **kwargs
        )

class OrderDispatcher(CoreOrderDispatcher):
    """
    Dispatcher to send order related emails in Spanish.
    """
    def send_order_placed_email_for_user(self, order, extra_context, attachments=None):
        event_code = self.ORDER_PLACED_EVENT_CODE
        
        # Basic context for Spanish email
        subject = f"Confirmación de tu pedido en Pizzería Siciliana - #{order.number}"
        
        # Build a message in Spanish
        status_url = extra_context.get('status_url', '')
        
        body_txt = (
            f"¡Hola!\n\n"
            f"Muchas gracias por tu compra en Pizzería Siciliana.\n\n"
            f"Hemos recibido tu pedido #{order.number} satisfactoriamente y ya estamos trabajando en él.\n\n"
            f"Resumen del pedido:\n"
            f"- Número de pedido: {order.number}\n"
            f"- Total: {order.total_incl_tax} {order.currency}\n"
            f"- Estado: {order.status}\n\n"
            f"Puedes ver los detalles y seguir el estado de tu pedido aquí:\n"
            f"{status_url}\n\n"
            f"¡Que disfrutes de tu pizza!\n"
            f"El equipo de Pizzería Siciliana"
        )
        
        body_html = (
            f"<html>"
            f"<body style='font-family: Arial, sans-serif; color: #333;'>"
            f"<h2 style='color: #d32f2f;'>¡Gracias por tu pedido en Pizzería Siciliana!</h2>"
            f"<p>Hola,</p>"
            f"<p>Hemos recibido tu pedido <b>#{order.number}</b> y ya nos hemos puesto manos a la masa.</p>"
            f"<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px;'>"
            f"<p><b>Resumen:</b></p>"
            f"<ul>"
            f"<li><b>Número de pedido:</b> {order.number}</li>"
            f"<li><b>Total:</b> {order.total_incl_tax} {order.currency}</li>"
            f"<li><b>Estado:</b> {order.status}</li>"
            f"</ul>"
            f"</div>"
            f"<p>Puedes seguir el estado de tu pedido haciendo clic en el siguiente enlace:</p>"
            f"<p><a href='{status_url}' style='color: #d32f2f;'>Ver estado de mi pedido</a></p>"
            f"<p>¡Buen provecho!</p>"
            f"<hr>"
            f"<p style='font-size: 0.8em; color: #777;'>Pizzería Siciliana - La mejor pizza siciliana.</p>"
            f"</body>"
            f"</html>"
        )

        messages = {
            'subject': subject,
            'body': body_txt,
            'html': body_html,
            'sms': None,
        }
        
        self.dispatch_order_messages(
            order, messages, event_code, attachments=attachments
        )
