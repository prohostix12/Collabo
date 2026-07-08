"""
ecommerce/tasks.py
Celery tasks for:
  1. Pre-delivery WhatsApp reminder (day before delivery)
  2. Delivery-day WhatsApp message
  3. Abandoned cart reminders
  4. Bulk offer/coupon broadcast
"""

import logging
from datetime import date, timedelta
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


# ── 1. Pre-delivery reminder — runs daily at 9 AM ───────────────────────────

@shared_task(name='ecommerce.tasks.send_pre_delivery_reminders')
def send_pre_delivery_reminders():
    """
    For every order whose expected_delivery_date == tomorrow,
    send a WhatsApp reminder.
    """
    from .models import Order
    from .notification_service import notify_pre_delivery_reminder

    tomorrow = date.today() + timedelta(days=1)
    orders = Order.objects.filter(
        expected_delivery_date=tomorrow,
        status__in=['processing', 'shipped'],
        pre_delivery_notified=False,
    ).select_related('user', 'address').prefetch_related('items__product')

    count = 0
    for order in orders:
        try:
            delivery_str = tomorrow.strftime('%A, %d %B %Y')
            notify_pre_delivery_reminder(order, delivery_str)
            # Also send delivery OTP the day before so customer is ready
            if order.delivery_otp:
                from .gupshup import notify_delivery_otp
                notify_delivery_otp(order)
            order.pre_delivery_notified = True
            order.save(update_fields=['pre_delivery_notified'])
            count += 1
        except Exception as exc:
            logger.error(f"Pre-delivery notify failed for {order.order_id}: {exc}")

    logger.info(f"Pre-delivery reminders sent: {count}")
    return count


# ── 2. Delivery-day message — runs daily at 8 AM ────────────────────────────

@shared_task(name='ecommerce.tasks.send_delivery_day_messages')
def send_delivery_day_messages():
    """
    For every order whose expected_delivery_date == today,
    send a WhatsApp delivery-day message.
    """
    from .models import Order
    from .notification_service import notify_delivery_day

    today = date.today()
    orders = Order.objects.filter(
        expected_delivery_date=today,
        status__in=['processing', 'shipped'],
        delivery_day_notified=False,
    ).select_related('user', 'address').prefetch_related('items__product')

    count = 0
    for order in orders:
        try:
            notify_delivery_day(order)
            # Send delivery OTP on delivery day so customer can share it with the delivery person
            if order.delivery_otp:
                from .gupshup import notify_delivery_otp
                notify_delivery_otp(order)
            order.delivery_day_notified = True
            order.save(update_fields=['delivery_day_notified'])
            count += 1
        except Exception as exc:
            logger.error(f"Delivery-day notify failed for {order.order_id}: {exc}")

    logger.info(f"Delivery-day messages sent: {count}")
    return count


# ── 3. Abandoned cart reminders — runs every 2 hours ────────────────────────

@shared_task(name='ecommerce.tasks.send_abandoned_cart_reminders')
def send_abandoned_cart_reminders():
    """
    Find carts that have items but no recent order.
    Remind users who haven't checked out in 2+ hours.
    """
    from .models import Cart, CartItem, StoreSettings
    from .notification_service import notify_abandoned_cart

    cutoff = timezone.now() - timedelta(hours=2)

    # Carts updated more than 2 hours ago with items
    stale_carts = Cart.objects.filter(
        updated_at__lte=cutoff,
        items__isnull=False,
    ).distinct().select_related('user').prefetch_related('items__product')

    store = StoreSettings.get_settings()
    coupon = None
    discount_pct = 10
    if store.coupon_codes:
        best = max(store.coupon_codes, key=lambda c: c.get('discount_percent', 0))
        coupon = best.get('code')
        discount_pct = best.get('discount_percent', 10)

    count = 0
    for cart in stale_carts:
        user = cart.user
        if not user.phone:
            continue
        # Skip if user placed an order in the last 24 hours
        from .models import Order
        recent_order = Order.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).exists()
        if recent_order:
            continue

        item_names = [item.product.name for item in cart.items.all()]
        if not item_names:
            continue

        try:
            notify_abandoned_cart(user, item_names, coupon, discount_pct)
            count += 1
        except Exception as exc:
            logger.error(f"Abandoned cart notify failed for {user.username}: {exc}")

    logger.info(f"Abandoned cart reminders sent: {count}")
    return count


# ── 4. Bulk offer broadcast (triggered by admin) ─────────────────────────────

@shared_task(name='ecommerce.tasks.broadcast_offer')
def broadcast_offer(coupon_code: str, discount_pct: int, description: str, user_ids: list = None):
    """
    Send a promotional message to all users with a phone number.
    If user_ids is given, only notify those users.
    """
    from accounts.models import User
    from .notification_service import notify_offer

    qs = User.objects.exclude(phone='').exclude(phone__isnull=True)
    if user_ids:
        qs = qs.filter(id__in=user_ids)

    count = 0
    for user in qs:
        try:
            notify_offer(user, coupon_code, discount_pct, description)
            count += 1
        except Exception as exc:
            logger.error(f"Offer broadcast failed for {user.username}: {exc}")

    logger.info(f"Offer broadcast sent to {count} users")
    return count


# ── 5. Single order placed notification (async) ──────────────────────────────

@shared_task(name='ecommerce.tasks.notify_order_placed_async')
def notify_order_placed_async(order_id: int):
    """
    Async task to send order-placed WhatsApp + SMS immediately after order.
    """
    from .models import Order
    from .notification_service import notify_order_placed

    try:
        order = Order.objects.select_related('user', 'address').prefetch_related('items__product').get(id=order_id)
        delivery_date = order.expected_delivery_date
        if delivery_date:
            delivery_str = delivery_date.strftime('%A, %d %B %Y')
        else:
            delivery_str = 'within 3-5 business days'
        notify_order_placed(order, delivery_str)
    except Order.DoesNotExist:
        logger.error(f"notify_order_placed_async: Order {order_id} not found")
    except Exception as exc:
        logger.error(f"notify_order_placed_async failed: {exc}")


# ── 6. Order delivered notification (called when status → delivered) ─────────

@shared_task(name='ecommerce.tasks.notify_order_delivered_async')
def notify_order_delivered_async(order_id: int):
    from .models import Order
    from .notification_service import notify_order_delivered

    try:
        order = Order.objects.select_related('user', 'address').prefetch_related('items__product').get(id=order_id)
        notify_order_delivered(order)
    except Order.DoesNotExist:
        logger.error(f"notify_order_delivered_async: Order {order_id} not found")
    except Exception as exc:
        logger.error(f"notify_order_delivered_async failed: {exc}")
