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
    # Gupshup template ID for welcome_new_user (Facebook ID: 2248049539363343)
    return _send_template(phone, 'f894c8ea-4e75-4341-9d62-69845ef7325d', [name])


def notify_seller_approved(user, store_name):
    phone = getattr(user, 'phone', '') or ''
    if not phone:
        return False
    name = user.first_name or user.username
    # Gupshup template ID for seller_account_approved — replace once the
    # template below is submitted and approved in the Gupshup/Meta dashboard.
    return _send_template(phone, 'REPLACE_WITH_SELLER_APPROVED_TEMPLATE_ID', [name, store_name])


def _order_phone(order) -> str:
    # Prefer the account's verified phone over the checkout address's phone —
    # the address field is free-text (can be a typo, or a different person's
    # number for delivery purposes) and was silently causing notifications to
    # go to the wrong number.
    phone = getattr(order.user, 'phone', '') or ''
    if not phone:
        phone = (order.address.phone if order.address else '') or ''
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
    # Gupshup template ID for order_placed_confirmation
    _send_template(phone, '00b7cd8a-87a7-4941-817b-18cf10317783', [name, str(order.order_id), items])


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
    # Gupshup template ID for order_delivered
    _send_template(phone, '0d0222de-140a-4b31-b71b-df9b3660161d', [name, str(order.order_id)])


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
