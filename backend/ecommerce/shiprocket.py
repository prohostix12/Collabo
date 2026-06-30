import requests
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external'
TOKEN_CACHE_KEY = 'shiprocket_auth_token'


def _get_token():
    token = cache.get(TOKEN_CACHE_KEY)
    if token:
        return token

    email = getattr(settings, 'SHIPROCKET_EMAIL', '')
    password = getattr(settings, 'SHIPROCKET_PASSWORD', '')
    if not email or not password:
        raise ValueError('Shiprocket credentials not configured')

    resp = requests.post(f'{SHIPROCKET_BASE}/auth/login', json={
        'email': email,
        'password': password,
    }, timeout=15)
    resp.raise_for_status()
    token = resp.json().get('token')
    cache.set(TOKEN_CACHE_KEY, token, timeout=9 * 24 * 3600)
    return token


def _headers():
    return {
        'Authorization': f'Bearer {_get_token()}',
        'Content-Type': 'application/json',
    }


def create_shiprocket_order(order):
    address = order.address
    if not address:
        raise ValueError('Order has no shipping address')

    items = []
    for item in order.items.select_related('product').all():
        p = item.product
        items.append({
            'name': p.name[:100],
            'sku': f'PROD-{p.id}',
            'units': item.quantity,
            'selling_price': float(item.price),
            'discount': 0,
            'tax': 0,
            'hsn': '',
        })

    total_weight = max(0.5, len(items) * 0.3)

    payload = {
        'order_id': order.order_id,
        'order_date': order.created_at.strftime('%Y-%m-%d %H:%M'),
        'pickup_location': 'Primary',
        'billing_customer_name': address.name.split()[0] if address.name else 'Customer',
        'billing_last_name': ' '.join(address.name.split()[1:]) if address.name and len(address.name.split()) > 1 else '',
        'billing_address': address.street_address or '',
        'billing_city': address.city or '',
        'billing_pincode': address.postal_code or '',
        'billing_state': address.state or '',
        'billing_country': 'India',
        'billing_email': order.user.email,
        'billing_phone': address.phone or order.user.phone or '',
        'shipping_is_billing': True,
        'order_items': items,
        'payment_method': 'Prepaid' if order.payment_status == 'completed' else 'COD',
        'sub_total': float(order.final_amount),
        'length': 20,
        'breadth': 15,
        'height': 10,
        'weight': total_weight,
    }

    resp = requests.post(f'{SHIPROCKET_BASE}/orders/create/adhoc', json=payload, headers=_headers(), timeout=30)
    data = resp.json()

    if resp.status_code >= 400 or 'status_code' in data and data['status_code'] != 1:
        error_msg = data.get('message') or data.get('errors') or str(data)
        logger.error(f'Shiprocket create order failed: {error_msg}')
        raise Exception(f'Shiprocket error: {error_msg}')

    return {
        'shiprocket_order_id': data.get('order_id'),
        'shipment_id': data.get('shipment_id'),
        'status': data.get('status'),
    }


def generate_awb(shipment_id, courier_id=None):
    payload = {'shipment_id': [shipment_id]}
    if courier_id:
        payload['courier_id'] = courier_id

    resp = requests.post(f'{SHIPROCKET_BASE}/courier/assign/awb', json=payload, headers=_headers(), timeout=30)
    data = resp.json()

    awb_data = data.get('response', {}).get('data', {})
    return {
        'awb_code': awb_data.get('awb_code', ''),
        'courier_name': awb_data.get('courier_name', ''),
        'courier_company_id': awb_data.get('courier_company_id'),
    }


def schedule_pickup(shipment_id):
    resp = requests.post(f'{SHIPROCKET_BASE}/courier/generate/pickup', json={
        'shipment_id': [shipment_id],
    }, headers=_headers(), timeout=30)
    return resp.json()


def track_shipment(awb_code):
    resp = requests.get(f'{SHIPROCKET_BASE}/courier/track/awb/{awb_code}', headers=_headers(), timeout=15)
    return resp.json()


def cancel_shiprocket_order(shiprocket_order_ids):
    resp = requests.post(f'{SHIPROCKET_BASE}/orders/cancel', json={
        'ids': shiprocket_order_ids if isinstance(shiprocket_order_ids, list) else [shiprocket_order_ids],
    }, headers=_headers(), timeout=15)
    return resp.json()
