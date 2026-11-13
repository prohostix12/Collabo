import csv
import io
import re
from datetime import timedelta

from django.conf import settings
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import OutreachCampaign, OutreachContact, OutreachSend, OutreachTemplate

MAX_RECIPIENTS = 2000
MAX_IMPORT_BYTES = 5 * 1024 * 1024


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_staff or u.is_superuser or getattr(u, 'user_type', '') == 'admin'))


class AdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]


def _dt(v):
    return v.isoformat() if v else None


def template_dict(t):
    return {'id': t.id, 'name': t.name, 'subject': t.subject, 'body': t.body, 'updated_at': _dt(t.updated_at)}


def contact_dict(c):
    return {'id': c.id, 'brand_name': c.brand_name, 'category': c.category, 'business_type': c.business_type, 'email': c.email,
            'contact_person': c.contact_person, 'phone': c.phone, 'website': c.website, 'notes': c.notes,
            'status': c.status, 'last_sent_at': _dt(c.last_sent_at), 'times_sent': c.times_sent}


def clean_business_type(value):
    v = str(value or '').strip().upper()
    return v if v in ('D2C', 'B2C') else ''


def campaign_dict(c, counts=None):
    if counts is None:
        counts = {r['status']: r['n'] for r in c.sends.values('status').annotate(n=Count('id'))}
    total = sum(counts.values())
    return {'id': c.id, 'template_name': c.template_name, 'subject': c.subject, 'status': c.status, 'note': c.note,
            'created_at': _dt(c.created_at), 'created_by': getattr(c.created_by, 'email', '') if c.created_by_id else '',
            'total': total, 'sent': counts.get('sent', 0), 'failed': counts.get('failed', 0),
            'queued': counts.get('queued', 0) + counts.get('sending', 0), 'skipped': counts.get('skipped', 0),
            'stalled': bool(c.status == 'running' and (not c.heartbeat or (timezone.now() - c.heartbeat) > timedelta(seconds=90)))}


def clean_email(value):
    v = str(value or '').strip().lower()
    try:
        validate_email(v)
    except ValidationError:
        return ''
    return v


def clean_phone(value):
    s = str(value if value is not None else '').strip()
    if re.fullmatch(r'\d+\.0', s):
        s = s[:-2]
    return s


# ----- templates ---------------------------------------------------------------------------------

class TemplateList(AdminView):
    def get(self, request):
        return Response([template_dict(t) for t in OutreachTemplate.objects.all()])

    def post(self, request):
        d = request.data
        name, subject, body = (d.get('name') or '').strip(), (d.get('subject') or '').strip(), (d.get('body') or '').strip()
        if not (name and subject and body):
            return Response({'error': 'Name, subject and message are all required.'}, status=400)
        return Response(template_dict(OutreachTemplate.objects.create(name=name, subject=subject, body=body)), status=201)


class TemplateDetail(AdminView):
    def put(self, request, pk):
        try:
            t = OutreachTemplate.objects.get(pk=pk)
        except OutreachTemplate.DoesNotExist:
            return Response({'error': 'Template not found.'}, status=404)
        d = request.data
        name, subject, body = (d.get('name') or '').strip(), (d.get('subject') or '').strip(), (d.get('body') or '').strip()
        if not (name and subject and body):
            return Response({'error': 'Name, subject and message are all required.'}, status=400)
        t.name, t.subject, t.body = name, subject, body
        t.save()
        return Response(template_dict(t))

    def delete(self, request, pk):
        OutreachTemplate.objects.filter(pk=pk).delete()
        return Response(status=204)


# ----- contacts ----------------------------------------------------------------------------------

def filter_contacts(params):
    qs = OutreachContact.objects.all()
    q = (params.get('search') or '').strip()
    if q:
        qs = qs.filter(Q(brand_name__icontains=q) | Q(email__icontains=q) | Q(contact_person__icontains=q))
    if params.get('category'):
        qs = qs.filter(category=params['category'])
    if params.get('business_type'):
        qs = qs.filter(business_type=params['business_type'])
    if params.get('status'):
        qs = qs.filter(status=params['status'])
    if params.get('contacted') == 'never':
        qs = qs.filter(times_sent=0)
    elif params.get('contacted') == 'sent':
        qs = qs.filter(times_sent__gt=0)
    return qs


class ContactList(AdminView):
    def get(self, request):
        qs = filter_contacts(request.query_params)
        try:
            page = max(1, int(request.query_params.get('page', 1)))
            size = min(200, max(1, int(request.query_params.get('page_size', 50))))
        except ValueError:
            page, size = 1, 50
        total = qs.count()
        rows = qs[(page - 1) * size: page * size]
        cats = list(OutreachContact.objects.exclude(category='').values('category').annotate(n=Count('id')).order_by('category'))
        btypes = list(OutreachContact.objects.exclude(business_type='').values('business_type').annotate(n=Count('id')).order_by('business_type'))
        allc = OutreachContact.objects.all()
        return Response({
            'count': total, 'page': page, 'page_size': size,
            'results': [contact_dict(c) for c in rows],
            'categories': [{'name': c['category'], 'count': c['n']} for c in cats],
            'business_types': [{'name': b['business_type'], 'count': b['n']} for b in btypes],
            'summary': {'total': allc.count(), 'never_contacted': allc.filter(times_sent=0, status='active').count(),
                        'opted_out': allc.filter(status='opted_out').count(), 'bounced': allc.filter(status='bounced').count()},
        })

    def post(self, request):
        d = request.data
        email = clean_email(d.get('email'))
        if not email:
            return Response({'error': 'Please enter a valid email address.'}, status=400)
        if OutreachContact.objects.filter(email=email).exists():
            return Response({'error': 'This email is already in your list.'}, status=400)
        c = OutreachContact.objects.create(
            email=email, brand_name=(d.get('brand_name') or '').strip(), category=(d.get('category') or '').strip(),
            business_type=clean_business_type(d.get('business_type')),
            contact_person=(d.get('contact_person') or '').strip(), phone=clean_phone(d.get('phone')),
            website=(d.get('website') or '').strip())
        return Response(contact_dict(c), status=201)


class ContactDetail(AdminView):
    def patch(self, request, pk):
        try:
            c = OutreachContact.objects.get(pk=pk)
        except OutreachContact.DoesNotExist:
            return Response({'error': 'Contact not found.'}, status=404)
        d = request.data
        if 'email' in d:
            email = clean_email(d['email'])
            if not email:
                return Response({'error': 'Please enter a valid email address.'}, status=400)
            if OutreachContact.objects.filter(email=email).exclude(pk=c.pk).exists():
                return Response({'error': 'Another brand already uses this email.'}, status=400)
            c.email = email
        for f in ('brand_name', 'category', 'contact_person', 'website', 'notes'):
            if f in d:
                setattr(c, f, str(d[f] or '').strip())
        if 'business_type' in d:
            c.business_type = clean_business_type(d['business_type'])
        if 'phone' in d:
            c.phone = clean_phone(d['phone'])
        if d.get('status') in ('active', 'opted_out', 'bounced'):
            c.status = d['status']
        c.save()
        return Response(contact_dict(c))

    def delete(self, request, pk):
        OutreachContact.objects.filter(pk=pk).delete()
        return Response(status=204)


class ContactBulk(AdminView):
    """POST {action: 'delete' | 'opt_out' | 'activate', ids: [...]}
    or {action, select_all: true, filters: {...}, exclude_ids: [...]} to act on every contact
    matching the current list filters instead of a fixed id list."""
    def post(self, request):
        d = request.data
        if d.get('select_all'):
            qs = filter_contacts(d.get('filters') or {})
            excl = [int(i) for i in (d.get('exclude_ids') or []) if str(i).isdigit()]
            if excl:
                qs = qs.exclude(pk__in=excl)
        else:
            ids = [int(i) for i in (d.get('ids') or []) if str(i).isdigit()]
            qs = OutreachContact.objects.filter(pk__in=ids)
        action = d.get('action')
        n = qs.count()
        if action == 'delete':
            qs.delete()
        elif action == 'opt_out':
            qs.update(status='opted_out')
        elif action == 'activate':
            qs.update(status='active')
        else:
            return Response({'error': 'Unknown action.'}, status=400)
        return Response({'affected': n})


class ContactImport(AdminView):
    """Upload an .xlsx or .csv. Every sheet with an "Email" column is read; brand name, category,
    contact person, phone and website columns are picked up when present. Existing emails are kept
    (blank fields are filled in); nothing is deleted."""

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'error': 'Choose a .xlsx or .csv file first.'}, status=400)
        if f.size > MAX_IMPORT_BYTES:
            return Response({'error': 'That file is too large (limit 5 MB).'}, status=400)
        raw = f.read()
        try:
            sheets = self._read_sheets(f.name.lower(), raw)
        except Exception:
            return Response({'error': 'Could not read that file. Please upload a valid .xlsx or .csv.'}, status=400)

        created = updated = invalid = dup = 0
        seen, bad_samples, per_sheet = set(), [], []
        for title, rows in sheets:
            found = self._parse_sheet(title, rows)
            if found is None:
                per_sheet.append({'sheet': title, 'emails': 0, 'note': 'no Email column'})
                continue
            n = 0
            for rec, raw_cell in found:
                emails = services.EMAIL_RE.findall(raw_cell)
                if not emails:
                    invalid += 1
                    if len(bad_samples) < 5:
                        bad_samples.append(str(raw_cell)[:60])
                    continue
                for em in emails:
                    email = clean_email(em)
                    if not email:
                        invalid += 1
                        continue
                    if email in seen:
                        dup += 1
                        continue
                    seen.add(email)
                    n += 1
                    obj, was_created = OutreachContact.objects.get_or_create(email=email, defaults=rec)
                    if was_created:
                        created += 1
                    else:
                        changed = False
                        for k, v in rec.items():
                            if v and not getattr(obj, k):
                                setattr(obj, k, v)
                                changed = True
                        if changed:
                            obj.save()
                            updated += 1
            per_sheet.append({'sheet': title, 'emails': n, 'note': '' if n else 'Email column is empty'})
        return Response({'created': created, 'updated': updated, 'duplicates_in_file': dup, 'invalid': invalid,
                         'invalid_samples': bad_samples, 'sheets': per_sheet})

    @staticmethod
    def _read_sheets(name, raw):
        if name.endswith('.csv'):
            text = raw.decode('utf-8-sig', errors='replace')
            return [('CSV', list(csv.reader(io.StringIO(text))))]
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
        return [(ws.title, [list(r) for r in ws.iter_rows(values_only=True)]) for ws in wb.worksheets]

    @staticmethod
    def _parse_sheet(title, rows):
        hdr_i, cols = None, {}
        for i, r in enumerate(rows[:6]):
            low = [str(c or '').strip().lower() for c in r]
            if any(('email' in c or 'e-mail' in c) for c in low):
                hdr_i = i
                break
        if hdr_i is None:
            return None
        low = [str(c or '').strip().lower() for c in rows[hdr_i]]

        def find(pred, exclude=()):
            for j, c in enumerate(low):
                if pred(c) and not any(x in c for x in exclude):
                    return j
            return None
        cols['email'] = find(lambda c: 'email' in c or 'e-mail' in c)
        cols['brand_name'] = find(lambda c: 'brand' in c and 'category' not in c)
        if cols['brand_name'] is None:  # (0 is a valid column, so don't use "or")
            cols['brand_name'] = find(lambda c: c in ('name', 'company', 'company name'))
        cols['category'] = find(lambda c: c == 'category' or c == 'category name')
        cols['business_type'] = find(lambda c: 'd2c' in c or 'b2c' in c or 'business type' in c or 'brand type' in c)
        cols['contact_person'] = find(lambda c: 'contact person' in c or c in ('person', 'founder', 'founders'))
        cols['phone'] = find(lambda c: 'contact number' in c or 'mobile' in c or 'phone' in c)
        cols['website'] = find(lambda c: 'website' in c or 'store link' in c)
        out = []

        def cell(r, key):
            j = cols.get(key)
            return r[j] if j is not None and j < len(r) else None
        for r in rows[hdr_i + 1:]:
            em = cell(r, 'email')
            if em in (None, ''):
                continue
            raw_type = str(cell(r, 'business_type') or '').strip().lower()
            business_type = 'D2C' if 'd2c' in raw_type else 'B2C' if 'b2c' in raw_type else ''
            rec = {'brand_name': str(cell(r, 'brand_name') or '').strip()[:255],
                   'category': (str(cell(r, 'category') or '').strip() or (title if title not in ('CSV', 'Sheet1') else ''))[:120],
                   'business_type': business_type,
                   'contact_person': str(cell(r, 'contact_person') or '').strip()[:255],
                   'phone': clean_phone(cell(r, 'phone'))[:60], 'website': str(cell(r, 'website') or '').strip()[:255]}
            out.append((rec, str(em)))
        return out


# ----- preview / test ----------------------------------------------------------------------------

def _resolve_template(data):
    tid = data.get('template_id')
    subject, body = data.get('subject'), data.get('body')
    t = OutreachTemplate.objects.filter(pk=tid).first() if tid else None
    return t, (subject if subject is not None and str(subject).strip() else (t.subject if t else '')), (body if body is not None and str(body).strip() else (t.body if t else ''))


class Preview(AdminView):
    def post(self, request):
        t, subject, body = _resolve_template(request.data)
        if not body:
            return Response({'error': 'Pick a template first.'}, status=400)
        contact = OutreachContact.objects.filter(pk=request.data.get('contact_id')).first() if request.data.get('contact_id') else None
        subj, text, html_body = services.render(subject, body, contact, bool(request.data.get('add_footer')),
                                                **({} if contact else {'brand_name': 'Sample Brand'}))
        if request.data.get('plain_style'):
            import html as _html
            html_body = '<pre style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;margin:0;">' + _html.escape(text) + '</pre>'
        return Response({'subject': subj, 'html': html_body, 'text': text,
                         'to': contact.email if contact else '', 'brand': contact.brand_name if contact else 'Sample Brand'})


class TestSend(AdminView):
    def post(self, request):
        t, subject, body = _resolve_template(request.data)
        if not body:
            return Response({'error': 'Pick a template first.'}, status=400)
        to = clean_email(request.data.get('to') or getattr(request.user, 'email', ''))
        if not to:
            return Response({'error': 'Enter a valid email address to send the test to.'}, status=400)
        subj, text, html_body = services.render(subject, body, None, bool(request.data.get('add_footer')), brand_name='Sample Brand')
        try:
            services.build_message('[TEST] ' + subj, text, html_body, to, plain=bool(request.data.get('plain_style'))).send(fail_silently=False)
        except Exception as exc:
            return Response({'error': f'The mail server rejected the test email: {str(exc)[:200]}'}, status=502)
        return Response({'sent_to': to})


# ----- campaigns ---------------------------------------------------------------------------------

class Limits(AdminView):
    def get(self, request):
        sent = services.sent_last_24h()
        return Response({'daily_limit': services.daily_limit(), 'sent_last_24h': sent,
                         'remaining': max(0, services.daily_limit() - sent), 'delay_seconds': services.delay_seconds(),
                         'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', '')})


class CampaignList(AdminView):
    def get(self, request):
        return Response([campaign_dict(c) for c in OutreachCampaign.objects.select_related('created_by')[:50]])

    def post(self, request):
        d = request.data
        t, subject, body = _resolve_template(d)
        if not (subject and body):
            return Response({'error': 'Pick a template first.'}, status=400)
        if d.get('select_all'):
            qs = filter_contacts(d.get('filters') or {})
            excl = [int(i) for i in (d.get('exclude_ids') or []) if str(i).isdigit()]
            if excl:
                qs = qs.exclude(pk__in=excl)
        else:
            ids = [int(i) for i in (d.get('contact_ids') or []) if str(i).isdigit()]
            qs = OutreachContact.objects.filter(pk__in=ids)
        selected = list(qs)
        if not selected:
            return Response({'error': 'Select at least one brand to email.'}, status=400)
        if len(selected) > MAX_RECIPIENTS:
            return Response({'error': f'Please send to at most {MAX_RECIPIENTS} brands at a time.'}, status=400)

        skip_contacted = d.get('skip_contacted', True)
        queue, skipped_optout, skipped_contacted = [], 0, 0
        for c in selected:
            if c.status != 'active':
                skipped_optout += 1
            elif skip_contacted and c.times_sent > 0:
                skipped_contacted += 1
            else:
                queue.append(c)
        if not queue:
            return Response({'error': 'Nothing to send: every selected brand is opted out, invalid or already emailed.',
                             'skipped_opted_out_or_invalid': skipped_optout, 'skipped_already_emailed': skipped_contacted}, status=400)

        if services.daily_remaining() <= 0:
            return Response({'error': f'The daily sending limit ({services.daily_limit()} emails per 24 hours) has been reached. Try again later.'}, status=429)

        campaign = OutreachCampaign.objects.create(
            template=t, template_name=t.name if t else 'Custom', subject=subject, body=body,
            add_footer=bool(d.get('add_footer')), plain_style=bool(d.get('plain_style')), created_by=request.user, status='running', heartbeat=timezone.now())
        OutreachSend.objects.bulk_create([OutreachSend(campaign=campaign, contact=c, email=c.email, brand_name=c.brand_name) for c in queue])
        services.start_campaign(campaign.pk)
        out = campaign_dict(campaign)
        out.update({'skipped_opted_out_or_invalid': skipped_optout, 'skipped_already_emailed': skipped_contacted,
                    'will_pause_for_limit': len(queue) > services.daily_remaining()})
        return Response(out, status=201)


class CampaignDetail(AdminView):
    def get(self, request, pk):
        try:
            c = OutreachCampaign.objects.select_related('created_by').get(pk=pk)
        except OutreachCampaign.DoesNotExist:
            return Response({'error': 'Campaign not found.'}, status=404)
        sends = c.sends.all()
        if request.query_params.get('status'):
            sends = sends.filter(status=request.query_params['status'])
        sends = sends.order_by('-id')[:300]
        d = campaign_dict(c)
        d['sends'] = [{'id': s.id, 'email': s.email, 'brand_name': s.brand_name, 'status': s.status, 'error': s.error, 'message_id': s.message_id, 'sent_at': _dt(s.sent_at)} for s in sends]
        return Response(d)


class CampaignAction(AdminView):
    def post(self, request, pk, action):
        try:
            c = OutreachCampaign.objects.get(pk=pk)
        except OutreachCampaign.DoesNotExist:
            return Response({'error': 'Campaign not found.'}, status=404)
        if action == 'pause':
            OutreachCampaign.objects.filter(pk=pk, status='running').update(status='paused', note='Paused by you.')
        elif action == 'cancel':
            OutreachCampaign.objects.filter(pk=pk).exclude(status='completed').update(status='cancelled', note='Cancelled by you.')
            c.sends.filter(status='queued').update(status='skipped', error='Campaign cancelled')
        elif action == 'resume':
            fresh = c.heartbeat and (timezone.now() - c.heartbeat) < timedelta(seconds=90)
            if c.status == 'running' and fresh:
                return Response({'error': 'This campaign is already sending.'}, status=400)
            if c.status in ('completed', 'cancelled'):
                return Response({'error': f'This campaign is {c.status} and cannot be resumed.'}, status=400)
            # an email caught mid-send by a restart may or may not have gone out: don't auto-repeat it
            c.sends.filter(status='sending').update(status='failed', error='Interrupted - check the Sent folder before retrying')
            if request.data.get('retry_failed'):
                c.sends.filter(status='failed').exclude(error__startswith='Address refused').update(status='queued', error='')
            if services.daily_remaining() <= 0:
                return Response({'error': f'The daily sending limit ({services.daily_limit()} emails per 24 hours) has been reached. Try again later.'}, status=429)
            if not c.sends.filter(status='queued').exists():
                OutreachCampaign.objects.filter(pk=pk).update(status='completed', note='')
            else:
                OutreachCampaign.objects.filter(pk=pk).update(status='running', note='', heartbeat=timezone.now())
                services.start_campaign(pk)
        else:
            return Response({'error': 'Unknown action.'}, status=400)
        c.refresh_from_db()
        return Response(campaign_dict(c))
