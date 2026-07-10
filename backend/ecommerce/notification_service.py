"""
notification_service.py
Production-grade WhatsApp notification service using Gupshup WhatsApp Business API.

API Docs: https://console-docs.gupshup.io/docs/whatsapp-business-api

Handles:
- Order confirmation + expected delivery date  (on order placed)
- WhatsApp reminder the day before delivery    (Celery beat daily 9 AM)
- WhatsApp message on delivery day             (Celery beat daily 8 AM)
- WhatsApp on delivered status change          (on status update)
- Coupon / offer promotional broadcasts        (admin triggered)
- Abandoned cart reminders                     (Celery beat every 2 hrs)
"""

import json
import logging
import requests
from decouple import config

logger = logging.getLogger(__name__)

# ── Gupshup config ────────────────────────────────────────────────────────────
GUPSHUP_API_KEY      = config('GUPSHUP_API_KEY',    default='')
GUPSHUP_SOURCE       = config('GUPSHUP_SOURCE_NUMBER', default='')   # Your registered WA number e.g. 917834811114
GUPSHUP_APP_NAME     = config('GUPSHUP_APP_NAME',    default='')   # App name in Gupshup dashboard
GUPSHUP_MSG_URL      = 'https://api.gupshup.io/wa/api/v1/msg'
GUPSHUP_TEMPLATE_URL = 'https://api.gupshup.io/wa/api/v1/template/msg'


def _e164(phone: str) -> str:
    """
    Normalize Indian phone numbers to E.164 (no + prefix, Gupshup expects just digits).
    e.g. +91 98765 43210 → 919876543210
         09876543210     → 919876543210
         9876543210      → 919876543210
    """
    phone = phone.strip().replace(' ', '').replace('-', '').replace('+', '')
    if not phone:
        return ''
    # Already has country code (starts with 91 and length 12)
    if phone.startswith('91') and len(phone) == 12:
        return phone
    # 10-digit Indian number
    if len(phone) == 10:
        return '91' + phone
    # Has leading 0
    if phone.startswith('0') and len(phone) == 11:
        return '91' + phone[1:]
    return phone


def _is_configured() -> bool:
    return bool(GUPSHUP_API_KEY and GUPSHUP_SOURCE and GUPSHUP_APP_NAME
                and not GUPSHUP_API_KEY.startswith('your_'))


def send_whatsapp_template(to_phone: str, template_name: str, params: list) -> bool:
    """Send an approved WhatsApp template message via Gupshup."""
    if not _is_configured():
        logger.info(f"[GUPSHUP MOCK — Template] To: {to_phone} | {template_name} | {params}")
        return False

    dest = _e164(to_phone)
    if not dest:
        logger.warning(f"send_whatsapp_template: empty phone after normalization (raw={to_phone})")
        return False

    payload = {
        'channel':     'whatsapp',
        'source':      GUPSHUP_SOURCE,
        'destination': dest,
        'src.name':    GUPSHUP_APP_NAME,
        'template':    json.dumps({'id': template_name, 'params': params}),
    }
    headers = {
        'apikey':       GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    try:
        resp = requests.post(GUPSHUP_TEMPLATE_URL, data=payload, headers=headers, timeout=10)
        body = resp.json() if resp.content else {}
        if resp.status_code in range(200, 300):
            logger.info(f"Gupshup template sent ({template_name}) to {dest}: {body.get('messageId','')}")
            return True
        else:
            logger.error(f"Gupshup template error {resp.status_code} to {dest}: {body}")
            return False
    except Exception as exc:
        logger.error(f"Gupshup send_whatsapp_template exception ({dest}): {exc}")
        return False


def send_whatsapp(to_phone: str, text: str) -> bool:
    """
    Send a plain text WhatsApp session/freeform message via Gupshup.
    Returns True on success.

    Note: Session messages work within 24h of user's last message.
    For outbound-only (no prior user message), use approved templates.
    In sandbox mode this works directly after opt-in.
    """
    if not _is_configured():
        logger.info(f"[GUPSHUP MOCK — WhatsApp] To: {to_phone}\n{text}")
        return False

    dest = _e164(to_phone)
    if not dest:
        logger.warning(f"send_whatsapp: empty phone after normalization (raw={to_phone})")
        return False

    payload = {
        'channel':     'whatsapp',
        'source':      GUPSHUP_SOURCE,
        'destination': dest,
        'src.name':    GUPSHUP_APP_NAME,
        'message':     json.dumps({'type': 'text', 'text': text}),
    }
    headers = {
        'apikey':       GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    try:
        resp = requests.post(GUPSHUP_MSG_URL, data=payload, headers=headers, timeout=10)
        body = resp.json() if resp.content else {}
        if resp.status_code in range(200, 300):
            logger.info(f"Gupshup WhatsApp sent to {dest}: {body.get('messageId','')}")
            return True
        else:
            logger.error(f"Gupshup WhatsApp error {resp.status_code} to {dest}: {body}")
            return False
    except Exception as exc:
        logger.error(f"Gupshup send_whatsapp exception ({dest}): {exc}")
        return False


# ────────────────────────────────────────────────────────────────────────────
# Public notification functions (called from tasks and views)
# ────────────────────────────────────────────────────────────────────────────

def notify_order_placed(order, delivery_date_str: str):
    """Send order confirmation using approved template immediately after order."""
    phone = _get_order_phone(order)
    if not phone:
        return

    name  = order.user.first_name or order.user.username
    items = ', '.join(
        item.product.name for item in order.items.select_related('product').all()
    ) or 'your items'
    send_whatsapp_template(phone, 'order_placed_confirmation', [name, str(order.order_id), items])


def notify_pre_delivery_reminder(order, delivery_date_str: str):
    """WhatsApp reminder the day BEFORE expected delivery."""
    phone = _get_order_phone(order)
    if not phone:
        return

    name = order.user.first_name or order.user.username
    text = (
        f"📦 *Your order arrives tomorrow!*\n\n"
        f"Hi {name},\n"
        f"Order *{order.order_id}* is on its way and will be delivered "
        f"*tomorrow ({delivery_date_str})*.\n\n"
        f"📍 Delivery to: {_address_short(order)}\n\n"
        f"Please ensure someone is available to receive the package.\n"
        f"— CollaboCart 🛒"
    )
    send_whatsapp(phone, text)


def notify_delivery_day(order):
    """WhatsApp message on the actual delivery day."""
    phone = _get_order_phone(order)
    if not phone:
        return

    name = order.user.first_name or order.user.username
    text = (
        f"🎉 *Your order is arriving today!*\n\n"
        f"Hi {name},\n"
        f"Order *{order.order_id}* is out for delivery and will reach you *today*.\n\n"
        f"📍 Delivery to: {_address_short(order)}\n\n"
        f"Keep your phone handy — the delivery agent may call you.\n"
        f"— CollaboCart 🛒"
    )
    send_whatsapp(phone, text)


def notify_order_delivered(order):
    """Send delivery confirmation using approved template."""
    phone = _get_order_phone(order)
    if not phone:
        return

    name = order.user.first_name or order.user.username
    send_whatsapp_template(phone, 'order_delivered', [name, str(order.order_id)])


def notify_offer(user, coupon_code: str, discount_pct: int, description: str):
    """Send a promotional offer / coupon notification using approved template."""
    phone = user.phone
    if not phone:
        return

    name = user.first_name or user.username
    send_whatsapp_template(phone, 'offer_informations', [name, coupon_code, str(discount_pct)])


def notify_abandoned_cart(user, item_names: list, coupon_code: str = None, discount_pct: int = 10):
    """Send an abandoned-cart reminder using approved template."""
    phone = user.phone
    if not phone:
        return

    name      = user.first_name or user.username
    items_str = ', '.join(item_names[:3])
    if len(item_names) > 3:
        items_str += f' and {len(item_names) - 3} more'

    # Gupshup template ID for abandoned_cart (Facebook ID: 1385651606806303)
    send_whatsapp_template(phone, '3b02b92b-5962-45b9-8676-059e3be7f65f', [name, items_str])


# ── Internal helpers ──────────────────────────────────────────────────────────

def _get_order_phone(order) -> str:
    """Prefer address phone, then user.phone."""
    try:
        if order.address and order.address.phone:
            return order.address.phone
    except Exception:
        pass
    return order.user.phone or ''


def _items_summary(order) -> str:
    lines = []
    for item in order.items.select_related('product').all():
        lines.append(
            f"  • {item.product.name} x{item.quantity}"
            f" — ₹{float(item.price * item.quantity):,.0f}"
        )
    return '\n'.join(lines) if lines else '  • (see order details)'


def _address_short(order) -> str:
    try:
        a = order.address
        return f"{a.name}, {a.city}, {a.state} — {a.postal_code}"
    except Exception:
        return 'your registered address'
