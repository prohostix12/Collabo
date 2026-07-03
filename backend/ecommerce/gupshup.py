import requests
from django.conf import settings


def _send_whatsapp(phone: str, message: str) -> bool:
    """Send a WhatsApp message via Gupshup. Returns True on success."""
    api_key = settings.GUPSHUP_API_KEY
    source = settings.GUPSHUP_SOURCE_NUMBER
    app_name = settings.GUPSHUP_APP_NAME

    if not api_key or not source or not phone:
        return False

    # Normalise phone: strip spaces/+, ensure country code
    phone = phone.strip().replace(' ', '').replace('-', '').replace('+', '')
    if phone.startswith('0'):
        phone = '91' + phone[1:]
    elif len(phone) == 10:
        phone = '91' + phone

    try:
        resp = requests.post(
            'https://api.gupshup.io/sm/api/v1/msg',
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
        return resp.status_code == 202
    except Exception:
        return False


def notify_order_placed(order):
    name = order.address.name if order.address else order.user.username
    phone = order.address.phone if order.address else ''
    if not phone:
        return
    msg = (
        f"Hi {name}! 🎉 Your order *{order.order_id}* has been placed successfully on Collabo.\n\n"
        f"Total: ₹{order.final_amount}\n"
        f"Payment: {'Cash on Delivery' if order.payment_method == 'cod' else 'Paid Online'}\n\n"
        f"We'll notify you when it ships. Thank you for shopping! 🛍️"
    )
    _send_whatsapp(phone, msg)


def notify_order_shipped(order):
    name = order.address.name if order.address else order.user.username
    phone = order.address.phone if order.address else ''
    if not phone:
        return
    tracking = f"\nTracking: {order.tracking_number}" if order.tracking_number else ''
    provider = f" via {order.shipping_provider}" if order.shipping_provider else ''
    msg = (
        f"Hi {name}! 📦 Your Collabo order *{order.order_id}* has been shipped{provider}!{tracking}\n\n"
        f"We'll update you once it's out for delivery. 🚚"
    )
    _send_whatsapp(phone, msg)


def notify_order_delivered(order):
    name = order.address.name if order.address else order.user.username
    phone = order.address.phone if order.address else ''
    if not phone:
        return
    msg = (
        f"Hi {name}! ✅ Your Collabo order *{order.order_id}* has been delivered!\n\n"
        f"We hope you love your purchase. Rate your experience at collabo.co.in 🌟"
    )
    _send_whatsapp(phone, msg)


def notify_order_cancelled(order):
    name = order.address.name if order.address else order.user.username
    phone = order.address.phone if order.address else ''
    if not phone:
        return
    msg = (
        f"Hi {name}, your Collabo order *{order.order_id}* has been cancelled.\n\n"
        f"Reason: {order.cancel_reason or 'Not specified'}\n\n"
        f"If you paid online, your refund will be processed in 5-7 business days. "
        f"Need help? Visit collabo.co.in"
    )
    _send_whatsapp(phone, msg)
