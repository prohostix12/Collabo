"""Rendering and sending for brand outreach emails.

Sending runs in a background thread with a pause between emails (Zoho throttles fast senders)
and a rolling 24-hour cap, because the same mailbox also sends order emails to customers and
a blocked mailbox would stop those too. All progress is stored in the database, so any
gunicorn worker can report it, and a paused or interrupted campaign can be resumed.
"""
import html
import logging
import re
import smtplib
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.db import close_old_connections
from django.utils import timezone

from .models import OutreachCampaign, OutreachContact, OutreachSend

logger = logging.getLogger(__name__)

PLACEHOLDER = re.compile(r'\{\{\s*(\w+)\s*\}\}')
URL_RE = re.compile(r'(https?://[^\s<]+)')
EMAIL_RE = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
FOOTER_TEXT = "If you'd prefer not to receive emails from us, just reply with \"unsubscribe\" and we'll remove you."


def daily_limit():
    return int(getattr(settings, 'OUTREACH_DAILY_LIMIT', 200))


def delay_seconds():
    return float(getattr(settings, 'OUTREACH_DELAY_SECONDS', 4))


def sent_last_24h():
    return OutreachSend.objects.filter(status='sent', sent_at__gte=timezone.now() - timedelta(hours=24)).count()


def daily_remaining():
    return max(0, daily_limit() - sent_last_24h())


# ----- rendering ----------------------------------------------------------------------------

def merge_values(contact=None, **override):
    vals = {
        'brand_name': (getattr(contact, 'brand_name', '') or '').strip() or 'Brand',
        'contact_person': (getattr(contact, 'contact_person', '') or '').strip(),
        'category': (getattr(contact, 'category', '') or '').strip(),
        'email': (getattr(contact, 'email', '') or '').strip(),
    }
    vals.update(override)
    return vals


def fill(text, values):
    return PLACEHOLDER.sub(lambda m: str(values.get(m.group(1), '') or ''), text or '')


def _linkify(escaped):
    def repl(m):
        url = m.group(1)
        trail = ''
        while url and url[-1] in '.,;:!?)':
            trail = url[-1] + trail
            url = url[:-1]
        return f'<a href="{url}" style="color:#ea580c;">{url}</a>{trail}'
    return URL_RE.sub(repl, escaped)


def _inline(line):
    s = html.escape(line, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    return _linkify(s)


def body_to_html(body, footer=False):
    out, para, bullets = [], [], []

    def flush_para():
        if para:
            out.append('<p style="margin:0 0 14px;">' + '<br>'.join(_inline(l) for l in para) + '</p>')
            para.clear()

    def flush_bullets():
        if bullets:
            out.append('<ul style="margin:0 0 14px;padding-left:22px;list-style:disc outside;">' + ''.join(f'<li style="margin:0 0 4px;">{_inline(b)}</li>' for b in bullets) + '</ul>')
            bullets.clear()

    for raw in (body or '').replace('\r\n', '\n').split('\n'):
        line = raw.rstrip()
        if not line.strip():
            flush_para(); flush_bullets()
        elif line.lstrip().startswith('- '):
            flush_para(); bullets.append(line.lstrip()[2:])
        else:
            flush_bullets(); para.append(line)
    flush_para(); flush_bullets()
    if footer:
        out.append(f'<p style="margin:18px 0 0;color:#6b7280;font-size:12px;">{html.escape(FOOTER_TEXT)}</p>')
    return ('<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;max-width:640px;">'
            + ''.join(out) + '</div>')


def body_to_text(body, footer=False):
    text = (body or '').replace('\r\n', '\n').replace('**', '')
    if footer:
        text += '\n\n' + FOOTER_TEXT
    return text


def render(subject, body, contact=None, footer=False, **override):
    values = merge_values(contact, **override)
    subj = ' '.join(fill(subject, values).split())
    filled = fill(body, values)
    return subj, body_to_text(filled, footer), body_to_html(filled, footer)


def build_message(subject, text, html_body, to_email, connection=None):
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'Collabo <info@collabo.co.in>'
    msg = EmailMultiAlternatives(subject, text, from_email, [to_email], connection=connection,
                                 reply_to=[from_email],
                                 headers={'List-Unsubscribe': '<mailto:info@collabo.co.in?subject=Unsubscribe>'})
    msg.attach_alternative(html_body, 'text/html')
    return msg


# ----- sending --------------------------------------------------------------------------------

def start_campaign(campaign_id):
    threading.Thread(target=run_campaign, args=(campaign_id,), daemon=True, name=f'outreach-{campaign_id}').start()


def run_campaign(campaign_id):
    close_old_connections()
    try:
        _run(campaign_id)
    except Exception as exc:  # never leave a campaign stuck as "running"
        logger.exception('Outreach campaign %s crashed', campaign_id)
        OutreachCampaign.objects.filter(pk=campaign_id, status='running').update(status='paused', note=f'Stopped by an error: {str(exc)[:180]}')
    finally:
        close_old_connections()


def _pause(cid, note):
    OutreachCampaign.objects.filter(pk=cid, status='running').update(status='paused', note=note[:255])


def _run(cid):
    campaign = OutreachCampaign.objects.get(pk=cid)
    OutreachCampaign.objects.filter(pk=cid).update(status='running', note='', heartbeat=timezone.now())
    conn = get_connection(fail_silently=False)
    try:
        conn.open()
    except Exception as exc:
        _pause(cid, f'Could not connect to the mail server: {str(exc)[:150]}')
        return
    pause = delay_seconds()
    try:
        while True:
            state = OutreachCampaign.objects.filter(pk=cid).values_list('status', flat=True).first()
            if state != 'running':
                break
            if daily_remaining() <= 0:
                _pause(cid, f'Daily sending limit ({daily_limit()} emails per 24 hours) reached. Click Resume later to continue.')
                break
            send = campaign.sends.filter(status='queued').order_by('id').first()
            if send is None:
                OutreachCampaign.objects.filter(pk=cid, status='running').update(status='completed', note='')
                break
            if not OutreachSend.objects.filter(pk=send.pk, status='queued').update(status='sending'):
                continue
            send.refresh_from_db()
            _deliver(conn, campaign, send)
            OutreachCampaign.objects.filter(pk=cid).update(heartbeat=timezone.now())
            if not campaign.sends.filter(status='queued').exists():
                OutreachCampaign.objects.filter(pk=cid, status='running').update(status='completed', note='')
                break
            time.sleep(pause)
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _deliver(conn, campaign, send):
    contact = send.contact
    try:
        subject, text, html_body = render(campaign.subject, campaign.body, contact, campaign.add_footer,
                                          brand_name=(send.brand_name or '').strip() or 'Brand')
        msg = build_message(subject, text, html_body, send.email, connection=conn)
        try:
            msg.send(fail_silently=False)
        except (smtplib.SMTPServerDisconnected, ConnectionError):
            conn.close(); conn.open()  # the server dropped an idle connection: reconnect once and retry
            msg.send(fail_silently=False)
        now = timezone.now()
        OutreachSend.objects.filter(pk=send.pk).update(status='sent', sent_at=now, error='')
        if contact:
            OutreachContact.objects.filter(pk=contact.pk).update(last_sent_at=now, times_sent=contact.times_sent + 1)
    except smtplib.SMTPRecipientsRefused as exc:
        OutreachSend.objects.filter(pk=send.pk).update(status='failed', error=f'Address refused by the mail server: {str(exc)[:200]}')
        if contact:
            OutreachContact.objects.filter(pk=contact.pk).update(status='bounced')
    except Exception as exc:
        logger.warning('Outreach send to %s failed: %s', send.email, exc)
        OutreachSend.objects.filter(pk=send.pk).update(status='failed', error=str(exc)[:400])
