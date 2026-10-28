"""Transactional emails for orders, payments, returns/refunds and wallet payouts.

These are triggered from the model signals in models.py, so they fire exactly once per
event no matter which code path changed the order (checkout, seller/admin status
change, customer cancel/return, payment webhook). Sending happens in a background
thread after the DB transaction commits, so a slow or failing mail server can never
slow down or break the request that caused the event.
"""
import html
import logging
import threading

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction

logger = logging.getLogger(__name__)

SITE_URL = 'https://collabo.co.in'
BRAND_ORANGE = '#f97316'
RED = '#dc2626'


def _money(value):
    try:
        return f"₹{float(value):,.2f}".replace('.00', '')
    except (TypeError, ValueError):
        return f"₹{value}"


def _from_email():
    return getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'Collabo <info@collabo.co.in>'


def _wrap_html(title, name, intro_html, body_html='', cta_label='Visit Collabo', cta_url=SITE_URL, accent=BRAND_ORANGE):
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:20px 8px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="background:{accent};padding:18px 24px;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:.3px;">Collabo</td></tr>
<tr><td style="padding:26px 24px 8px;">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#18181b;">{html.escape(title)}</h1>
<p style="margin:0 0 6px;font-size:15px;">Hi {html.escape(name)},</p>
{intro_html}
</td></tr>
<tr><td style="padding:0 24px 8px;">{body_html}</td></tr>
<tr><td align="center" style="padding:14px 24px 26px;">
<a href="{cta_url}" style="background:{accent};color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">{html.escape(cta_label)}</a>
</td></tr>
<tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:16px 24px;color:#71717a;font-size:12px;line-height:1.6;">
Need help? Just reply to this email or write to <a href="mailto:info@collabo.co.in" style="color:{accent};text-decoration:none;">info@collabo.co.in</a>.<br>
&copy; Collabo &middot; <a href="{SITE_URL}" style="color:#71717a;">collabo.co.in</a>
</td></tr></table></td></tr></table></body></html>"""


def _send(to_email, subject, text, html_body):
    """Send in a background thread once the surrounding transaction has committed."""
    if not to_email:
        return

    def _do_send():
        try:
            msg = EmailMultiAlternatives(subject, text, _from_email(), [to_email])
            msg.attach_alternative(html_body, 'text/html')
            msg.send(fail_silently=False)
        except Exception:
            logger.exception('Could not send email "%s" to %s', subject, to_email)

    transaction.on_commit(lambda: threading.Thread(target=_do_send, daemon=True).start())


def _intro(text):
    return f'<p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#3f3f46;">{html.escape(text)}</p>'


def _section(label, inner):
    return (f'<p style="margin:20px 0 8px;font-size:12px;font-weight:bold;letter-spacing:.8px;color:#71717a;text-transform:uppercase;">'
            f'{html.escape(label)}</p>{inner}')


def _facts_html(rows):
    inner = ''.join(
        f'<tr><td style="padding:5px 14px 5px 0;color:#71717a;font-size:14px;white-space:nowrap;" valign="top">{html.escape(k)}</td>'
        f'<td style="padding:5px 0;font-weight:bold;font-size:14px;">{html.escape(str(v))}</td></tr>'
        for k, v in rows if v
    )
    return ('<table width="100%" cellpadding="0" cellspacing="0" role="presentation" '
            'style="background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;">'
            f'<tr><td style="padding:10px 16px;"><table cellpadding="0" cellspacing="0" role="presentation">{inner}</table></td></tr></table>')


# ----- order helpers --------------------------------------------------------------------

def _order_name(order):
    if order.address and getattr(order.address, 'name', None):
        return order.address.name
    return order.user.first_name or order.user.username


def _image_url(product):
    """A picture an email client can actually load: https URLs and /media paths only
    (base64 data: URIs are blocked by Gmail/Outlook, so those fall back to a placeholder)."""
    candidates = [getattr(product, 'image', '') or '']
    extra = getattr(product, 'images', None)
    if isinstance(extra, list):
        candidates += [u for u in extra if isinstance(u, str)]
    for u in candidates:
        u = u.strip()
        if u.startswith('//'):
            u = 'https:' + u
        if u.startswith('http://'):
            u = 'https://' + u[len('http://'):]
        if u.startswith('https://'):
            return html.escape(u, quote=True)
        if u.startswith('/media/'):
            return html.escape(SITE_URL + u, quote=True)
    return ''


def _items(order):
    return list(order.items.select_related('product').all())


def _items_text(order):
    return '\n'.join(f"  - {it.product.name} x {it.quantity}  {_money(it.price * it.quantity)}" for it in _items(order))


def _items_html(order):
    rows = []
    for it in _items(order):
        img = _image_url(it.product)
        thumb = (f'<img src="{img}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:cover;'
                 'border-radius:8px;border:1px solid #e4e4e7;background:#f4f4f5;">'
                 if img else '<div style="width:64px;height:64px;border-radius:8px;background:#f4f4f5;border:1px solid #e4e4e7;"></div>')
        rows.append(
            f'<tr><td width="64" style="padding:10px 12px 10px 0;border-bottom:1px solid #e4e4e7;" valign="top">{thumb}</td>'
            '<td style="padding:10px 8px 10px 0;border-bottom:1px solid #e4e4e7;font-size:14px;line-height:1.4;" valign="top">'
            f'<span style="font-weight:bold;">{html.escape(it.product.name)}</span><br>'
            f'<span style="color:#71717a;font-size:13px;">Qty {it.quantity} &middot; {_money(it.price)} each</span></td>'
            '<td align="right" style="padding:10px 0;border-bottom:1px solid #e4e4e7;font-size:14px;font-weight:bold;white-space:nowrap;" valign="top">'
            f'{_money(it.price * it.quantity)}</td></tr>')
    return f'<table width="100%" cellpadding="0" cellspacing="0" role="presentation">{"".join(rows)}</table>'


def _totals(order):
    rows = [('Subtotal', _money(order.total_amount))]
    if order.discount_amount and float(order.discount_amount) > 0:
        rows.append(('Discount', f"-{_money(order.discount_amount)}"))
    rows.append(('Delivery', _money(order.delivery_charge) if order.delivery_charge and float(order.delivery_charge) > 0 else 'Free'))
    return rows


def _totals_html(order):
    lines = ''.join(
        f'<tr><td style="padding:3px 0;color:#52525b;font-size:14px;">{k}</td><td align="right" style="padding:3px 0;font-size:14px;">{v}</td></tr>'
        for k, v in _totals(order))
    lines += ('<tr><td style="padding:10px 0 0;border-top:1px solid #e4e4e7;font-size:16px;font-weight:bold;">Total</td>'
              f'<td align="right" style="padding:10px 0 0;border-top:1px solid #e4e4e7;font-size:16px;font-weight:bold;">{_money(order.final_amount)}</td></tr>')
    return f'<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:10px;">{lines}</table>'


def _address_lines(order):
    a = order.address
    if not a:
        return []
    place = ', '.join(x for x in (a.city, getattr(a, 'district', ''), a.state) if x)
    if a.postal_code:
        place += f" - {a.postal_code}"
    return [p for p in (a.name, a.street_address, place, f"Phone: {a.phone}" if a.phone else '') if p]


def _address_html(order):
    lines = _address_lines(order)
    if not lines:
        return ''
    inner = '<br>'.join(html.escape(line) for line in lines)
    return _section('Delivering to', '<div style="font-size:14px;line-height:1.6;background:#fafafa;border:1px solid #e4e4e7;'
                                     f'border-radius:10px;padding:12px 16px;">{inner}</div>')


def _order_mail(order, subject, title, intro, extra_rows=(), show_address=False, accent=BRAND_ORANGE):
    name = _order_name(order)
    to = (order.user.email or '').strip()
    placed_on = order.created_at.strftime('%d %b %Y') if getattr(order, 'created_at', None) else ''
    rows = [('Order ID', order.order_id), ('Order date', placed_on)] + [r for r in extra_rows if r[1]]

    text = f"Hi {name},\n\n{intro}\n\n" + '\n'.join(f"{k}: {v}" for k, v in rows if v)
    text += f"\n\nItems:\n{_items_text(order)}\n\n" + '\n'.join(f"{k}: {v}" for k, v in _totals(order))
    text += f"\nTotal: {_money(order.final_amount)}\n"
    if show_address and _address_lines(order):
        text += "\nDelivering to:\n" + '\n'.join(_address_lines(order)) + "\n"
    text += f"\nView your orders: {SITE_URL}\n\n- Team Collabo"

    body = _section('Order details', _facts_html(rows))
    body += _section('Items', _items_html(order) + _totals_html(order))
    if show_address:
        body += _address_html(order)
    _send(to, subject, text, _wrap_html(title, name, _intro(intro), body, 'View my orders', SITE_URL, accent))


# ----- public order events --------------------------------------------------------------

def order_placed(order):
    method = (order.payment_method or '').lower()
    paid = order.payment_status == 'completed'
    _order_mail(
        order, f"Order confirmed - {order.order_id}", 'Thank you for your order!',
        'We have received your order and will start processing it right away.',
        [('Payment', f"{method.upper()} - {'Paid' if paid else 'Pay on delivery' if method == 'cod' else 'Pending'}"),
         ('Expected delivery', order.expected_delivery_date.strftime('%d %b %Y') if order.expected_delivery_date else '')],
        show_address=True,
    )


def payment_received(order):
    _order_mail(
        order, f"Payment received - {order.order_id}", 'Payment received',
        f"We have received your payment of {_money(order.final_amount)}. Thank you!",
        [('Payment method', (order.payment_method or '').upper())],
    )


def payment_failed(order):
    _order_mail(
        order, f"Payment failed - {order.order_id}", 'Your payment did not go through',
        'We could not confirm the payment for your order. If money was deducted it will be refunded by your bank automatically. You can try placing the order again.',
        accent=RED,
    )


def order_shipped(order):
    _order_mail(
        order, f"Your order has been shipped - {order.order_id}", 'Your order is on its way!',
        'Good news - your order has been shipped and is heading to you.',
        [('Courier', order.shipping_provider), ('Tracking number', order.tracking_number)],
        show_address=True,
    )


def order_delivered(order):
    _order_mail(
        order, f"Delivered - {order.order_id}", 'Your order has been delivered',
        'Your order has been delivered. We hope you love it! If anything is wrong, you can request a return from your orders page.',
        show_address=True,
    )


def order_cancelled(order):
    _order_mail(
        order, f"Order cancelled - {order.order_id}", 'Your order has been cancelled',
        'Your order has been cancelled. If you paid online, the refund goes back to your original payment method.',
        [('Reason', order.cancel_reason)], accent=RED,
    )


def return_requested(order):
    _order_mail(
        order, f"Return request received - {order.order_id}", 'We received your return request',
        'We have received your return request and will review it shortly. We will email you with the outcome.',
        [('Reason', order.return_reason)],
    )


def order_returned(order):
    _order_mail(
        order, f"Return approved - {order.order_id}", 'Your return has been approved',
        'Your return has been processed. Any refund due will be issued to your original payment method.',
    )


def order_refunded(order):
    _order_mail(
        order, f"Refund issued - {order.order_id}", 'Your refund has been issued',
        f"We have issued a refund of {_money(order.final_amount)}. It can take 5-7 business days to appear in your account.",
    )


def return_rejected(order):
    _order_mail(
        order, f"Return request update - {order.order_id}", 'Update on your return request',
        'We reviewed your return request and unfortunately we could not approve it. Reply to this email if you would like to talk to us about it.',
        accent=RED,
    )


# ----- wallet payouts -------------------------------------------------------------------

def _payout_mail(payout, subject, title, intro, rows=(), accent=BRAND_ORANGE):
    user = payout.user
    name = user.first_name or user.username
    all_rows = [('Amount', _money(payout.amount))] + list(rows)
    text = f"Hi {name},\n\n{intro}\n\n" + '\n'.join(f"{k}: {v}" for k, v in all_rows if v) + "\n\n- Team Collabo"
    _send((user.email or '').strip(), subject, text,
          _wrap_html(title, name, _intro(intro), _section('Details', _facts_html(all_rows)), 'Open Collabo', SITE_URL, accent))


def payout_requested(payout):
    acct = payout.account_number[-4:] if payout.account_number else ''
    _payout_mail(payout, 'Withdrawal request received', 'We received your withdrawal request',
                 'Your wallet withdrawal request has been received and is being reviewed.',
                 [('Bank account', f"ending {acct}" if acct else '')])


def payout_completed(payout):
    _payout_mail(payout, 'Your withdrawal has been paid', 'Your withdrawal is complete',
                 'Your wallet withdrawal has been paid out to your bank account.',
                 [('Bank reference (UTR)', payout.bank_reference)])


def payout_rejected(payout):
    _payout_mail(payout, 'Your withdrawal request was declined', 'Your withdrawal request was declined',
                 'We could not process your wallet withdrawal request. The amount is back in your wallet balance.',
                 [('Note from us', payout.admin_note)], accent=RED)
