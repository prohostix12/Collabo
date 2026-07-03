from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from ecommerce.models import Order
from ecommerce.gupshup import _send_whatsapp


class Command(BaseCommand):
    help = 'Send WhatsApp reminder to customers whose order is expected to arrive tomorrow'

    def handle(self, *args, **options):
        tomorrow = (timezone.now() + timedelta(days=1)).date()

        orders = Order.objects.filter(
            expected_delivery_date=tomorrow,
            status='shipped',
            pre_delivery_notified=False,
        ).select_related('address', 'user')

        sent = 0
        for order in orders:
            name = order.address.name if order.address else order.user.username
            phone = order.address.phone if order.address else ''
            if not phone:
                continue

            msg = (
                f"Hi {name}! 🚚 Your Collabo order *{order.order_id}* is arriving *tomorrow* "
                f"({tomorrow.strftime('%d %b %Y')})!\n\n"
                f"Please make sure someone is available to receive it.\n"
                + (f"Tracking: {order.tracking_number}\n" if order.tracking_number else '')
                + f"\nThank you for shopping with Collabo! 🎁"
            )
            if _send_whatsapp(phone, msg):
                order.pre_delivery_notified = True
                order.save(update_fields=['pre_delivery_notified'])
                sent += 1

        self.stdout.write(self.style.SUCCESS(f'Delivery reminders sent: {sent}'))
