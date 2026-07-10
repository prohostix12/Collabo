import json
import requests
from django.conf import settings


def _normalize_phone(phone: str) -> str:
    phone = phone.strip().replace(' ', '').replace('-', '').replace('+', '')
    if phone.startswith('0'):
        phone = '91' + phone[1:]
    elif len(phone) == 10:
        phone = '91' + phone
    return phone


def _send_whatsapp(phone: str, message: str) -> bool:
    """Send a free-form WhatsApp message via Gupshup (session messages only)."""
    api_key = settings.GUPSHUP_API_KEY
    source = settings.GUPSHUP_SOURCE_NUMBER
    app_name = settings.GUPSHUP_APP_NAME

    if not api_key or not source or not phone:
        return False

    phone = _normalize_phone(phone)

    try:
        resp = requests.post(
            'https://api.gupshup.io/wa/api/v1/msg',
            headers={'apikey': api_key, 'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'channel': 'whatsapp',
                'source': source,
                'destination': phone,
                'src.name': app_name,
                'message': message,
            },
            timeout=10,
        )
        return resp.status_code in (200, 201, 202)
    except Exception:
        return False


def _send_template(phone: str, template_name: str, params: list) -> bool:
    """Send an approved WhatsApp template message via Gupshup."""
    api_key = settings.GUPSHUP_API_KEY
    source = settings.GUPSHUP_SOURCE_NUMBER
    app_name = settings.GUPSHUP_APP_NAME

    if not api_key or not source or not phone:
        return False

    phone = _normalize_phone(phone)

    try:
        resp = requests.post(
            'https://api.gupshup.io/wa/api/v1/template/msg',
            headers={'apikey': api_key, 'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'channel': 'whatsapp',
                'source': source,
                'destination': phone,
                'src.name': app_name,
                'template': json.dumps({'id': template_name, 'params': params}),
            },
            timeout=10,
        )
        return resp.status_code in (200, 201, 202)
    except Exception:
        return False


def notify_welcome(user):
    phone = getattr(user, 'phone', '') or ''
    if not phone:
        return False
    name = user.first_name or user.username
    return _send_template(phone, 'welcome_new_user_message', [name])


def _order_phone(order) -> str:
    phone = (order.address.phone if order.address else '') or ''
    if not phone:
        phone = getattr(order.user, 'phone', '') or ''
    return phone


def _order_name(order) -> str:
    if order.address and getattr(order.address, 'name', None):
        return order.address.name
    return order.user.first_name or order.user.username


def notify_order_placed(order):
    phone = _order_phone(order)
    if not phone:
        return
    name = _order_name(order)
    items = ', '.join(
        item.product.name for item in order.items.select_related('product').all()
    ) or 'your items'
    _send_template(phone, 'order_placed_confirmation', [name, str(order.order_id), items])


def notify_order_shipped(order):
    phone = _order_phone(order)
    if not phone:
        return
    name = _order_name(order)
    tracking = f"\nTracking: {order.tracking_number}" if getattr(order, 'tracking_number', None) else ''
    provider = f" via {order.shipping_provider}" if getattr(order, 'shipping_provider', None) else ''
    msg = (
        f"Hi {name}! 📦 Your Collabo order *{order.order_id}* has been shipped{provider}!{tracking}\n\n"
        f"We'll update you once it's out for delivery. 🚚"
    )
    _send_whatsapp(phone, msg)


def notify_order_delivered(order):
    phone = _order_phone(order)
    if not phone:
        return
    name = _order_name(order)
    _send_template(phone, 'order_delivered', [name, str(order.order_id)])


def notify_order_cancelled(order):
    phone = _order_phone(order)
    if not phone:
        return
    name = _order_name(order)
    msg = (
        f"Hi {name}, your Collabo order *{order.order_id}* has been cancelled.\n\n"
        f"Reason: {getattr(order, 'cancel_reason', None) or 'Not specified'}\n\n"
        f"If you paid online, your refund will be processed in 5-7 business days. "
        f"Need help? Visit collabo.co.in"
    )
    _send_whatsapp(phone, msg)
