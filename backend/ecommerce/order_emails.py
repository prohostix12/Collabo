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


def _money(value):
    try:
        return f"₹{float(value):,.2f}".replace('.00', '')
    except (TypeError, ValueError):
        return f"₹{value}"


def _from_email():
    return getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'Collabo <info@collabo.co.in>'


def _wrap_html(title, name, intro_html, body_html=''):
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:{BRAND_ORANGE};padding:18px 24px;color:#fff;font-size:20px;font-weight:bold;">Collabo</td></tr>
<tr><td style="padding:24px;">
<h2 style="margin:0 0 12px;font-size:20px;">{html.escape(title)}</h2>
<p style="margin:0 0 12px;">Hi {html.escape(name)},</p>
{intro_html}
{body_html}
<p style="margin:24px 0 0;"><a href="{SITE_URL}" style="background:{BRAND_ORANGE};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;display:inline-block;">Visit Collabo</a></p>
<p style="margin:20px 0 0;color:#71717a;font-size:12px;">Need help? Reply to this email or write to info@collabo.co.in.<br>- Team Collabo</p>
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


# ----- order helpers --------------------------------------------------------------------

def _order_name(order):
    if order.address and getattr(order.address, 'name', None):
        return order.address.name
    return order.user.first_name or order.user.username


def _items_text(order):
    lines = []
    for it in order.items.select_related('product').all():
        lines.append(f"  - {it.product.name} x {it.quantity}  {_money(it.price * it.quantity)}")
    return '\n'.join(lines)


def _items_html(order):
    rows = ''.join(
        f'<tr><td style="padding:6px 0;border-bottom:1px solid #e4e4e7;">{html.escape(it.product.name)} &times; {it.quantity}</td>'
        f'<td align="right" style="padding:6px 0;border-bottom:1px solid #e4e4e7;">{_money(it.price * it.quantity)}</td></tr>'
        for it in order.items.select_related('product').all()
    )
    return f'<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 12px;">{rows}</table>'


def _address_text(order):
    a = order.address
    if not a:
        return ''
    parts = [a.name, a.street_address, ', '.join(p for p in (a.city, getattr(a, 'district', ''), a.state) if p), a.postal_code]
    return '\n'.join(p for p in parts if p)


def _facts_html(rows):
    inner = ''.join(
        f'<tr><td style="padding:3px 12px 3px 0;color:#71717a;">{html.escape(k)}</td><td style="padding:3px 0;font-weight:bold;">{html.escape(str(v))}</td></tr>'
        for k, v in rows if v
    )
    return f'<table cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0;">{inner}</table>'


def _order_mail(order, subject, title, intro, extra_rows=(), show_items=True):
    name = _order_name(order)
    to = (order.user.email or '').strip()
    rows = [('Order ID', order.order_id)] + list(extra_rows)
    text_rows = '\n'.join(f"{k}: {v}" for k, v in rows if v)
    text = f"Hi {name},\n\n{intro}\n\n{text_rows}\n"
    if show_items:
        text += f"\nItems:\n{_items_text(order)}\n"
    text += f"\nTotal: {_money(order.final_amount)}\n\nTrack your orders: {SITE_URL}\n\n- Team Collabo"
    body = _facts_html(rows)
    if show_items:
        body += _items_html(order)
    body += f'<p style="margin:0;font-size:15px;"><b>Total: {_money(order.final_amount)}</b></p>'
    _send(to, subject, text, _wrap_html(title, name, f'<p style="margin:0 0 12px;">{html.escape(intro)}</p>', body))


# ----- public order events --------------------------------------------------------------

def order_placed(order):
    paid = order.payment_status == 'completed'
    method = (order.payment_method or '').upper()
    addr = _address_text(order)
    _order_mail(
        order, f"Order confirmed - {order.order_id}", 'Thank you for your order!',
        'We have received your order and will start processing it right away.',
        [('Payment', f"{method} - {'Paid' if paid else 'Pending'}"), ('Deliver to', addr.replace('\n', ', ')),
         ('Expected delivery', order.expected_delivery_date.strftime('%d %b %Y') if order.expected_delivery_date else '')],
    )


def payment_received(order):
    _order_mail(
        order, f"Payment received - {order.order_id}", 'Payment received',
        f"We have received your payment of {_money(order.final_amount)}. Thank you!",
        [('Payment method', (order.payment_method or '').upper())], show_items=False,
    )


def payment_failed(order):
    _order_mail(
        order, f"Payment failed - {order.order_id}", 'Your payment did not go through',
        'We could not confirm the payment for your order. If money was deducted it will be refunded by your bank automatically. You can try placing the order again.',
        show_items=False,
    )


def order_shipped(order):
    _order_mail(
        order, f"Your order has been shipped - {order.order_id}", 'Your order is on its way!',
        'Good news - your order has been shipped.',
        [('Courier', order.shipping_provider), ('Tracking number', order.tracking_number)],
    )


def order_delivered(order):
    _order_mail(
        order, f"Delivered - {order.order_id}", 'Your order has been delivered',
        'Your order has been delivered. We hope you love it! If anything is wrong, you can request a return from your orders page.',
        show_items=False,
    )


def order_cancelled(order):
    _order_mail(
        order, f"Order cancelled - {order.order_id}", 'Your order has been cancelled',
        'Your order has been cancelled. If you paid online, the refund goes back to your original payment method.',
        [('Reason', order.cancel_reason)], show_items=False,
    )


def return_requested(order):
    _order_mail(
        order, f"Return request received - {order.order_id}", 'We received your return request',
        'We have received your return request and will review it shortly. We will email you with the outcome.',
        [('Reason', order.return_reason)], show_items=False,
    )


def order_returned(order):
    _order_mail(
        order, f"Return approved - {order.order_id}", 'Your return has been approved',
        'Your return has been processed. Any refund due will be issued to your original payment method.',
        show_items=False,
    )


def order_refunded(order):
    _order_mail(
        order, f"Refund issued - {order.order_id}", 'Your refund has been issued',
        f"We have issued a refund of {_money(order.final_amount)}. It can take 5-7 business days to appear in your account.",
        show_items=False,
    )


def return_rejected(order):
    _order_mail(
        order, f"Return request update - {order.order_id}", 'Update on your return request',
        'We reviewed your return request and unfortunately we could not approve it. Reply to this email if you would like to talk to us about it.',
        show_items=False,
    )


# ----- wallet payouts -------------------------------------------------------------------

def _payout_mail(payout, subject, title, intro, rows=()):
    user = payout.user
    name = user.first_name or user.username
    all_rows = [('Amount', _money(payout.amount))] + list(rows)
    text = f"Hi {name},\n\n{intro}\n\n" + '\n'.join(f"{k}: {v}" for k, v in all_rows if v) + "\n\n- Team Collabo"
    _send((user.email or '').strip(), subject, text, _wrap_html(title, name, f'<p style="margin:0 0 12px;">{html.escape(intro)}</p>', _facts_html(all_rows)))


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
                 [('Note from us', payout.admin_note)])
