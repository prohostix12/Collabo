from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from ecommerce.models import Cart
from ecommerce.gupshup import _send_whatsapp


class Command(BaseCommand):
    help = 'Send WhatsApp reminder to users who left items in cart for 24-48 hours'

    def handle(self, *args, **options):
        now = timezone.now()
        window_start = now - timedelta(hours=48)
        window_end = now - timedelta(hours=24)

        # Carts updated between 24 and 48 hours ago that still have items
        carts = (
            Cart.objects.filter(
                updated_at__gte=window_start,
                updated_at__lte=window_end,
                items__isnull=False,
            )
            .distinct()
            .select_related('user')
            .prefetch_related('items__product')
        )

        sent = 0
        for cart in carts:
            user = cart.user
            phone = getattr(user, 'phone', '') or ''
            if not phone:
                # Try to get phone from default address
                try:
                    addr = user.addresses.filter(is_default=True).first() or user.addresses.first()
                    phone = addr.phone if addr else ''
                except Exception:
                    phone = ''
            if not phone:
                continue

            items = list(cart.items.all())
            if not items:
                continue

            item_lines = '\n'.join(
                f"  • {item.product.name} (x{item.quantity}) — ₹{item.product.discount_price or item.product.price}"
                for item in items[:5]
            )
            more = f'\n  ...and {len(items) - 5} more items' if len(items) > 5 else ''

            msg = (
                f"Hi {user.username}! 🛒 You left something behind on Collabo!\n\n"
                f"Items in your cart:\n{item_lines}{more}\n\n"
                f"Complete your purchase before they sell out 👉 collabo.co.in/#cart"
            )
            if _send_whatsapp(phone, msg):
                sent += 1

        self.stdout.write(self.style.SUCCESS(f'Cart reminders sent: {sent}'))
