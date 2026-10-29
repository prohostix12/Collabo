"""Small square product thumbnails served from collabo.co.in for use in emails.

Emails used to hot-link the supplier's image URL. That breaks when the supplier's site
changes, blocks hot-linking or is slow, and base64 images can't be shown in email at all.
Here each product's picture is fetched once, resized to a 128x128 JPEG, cached on disk and
served from our own domain with long cache headers.
"""
import base64
import hashlib
import io
import ipaddress
import logging
import os
import socket
from urllib.parse import urljoin, urlparse

import requests
from django.conf import settings
from django.http import Http404, HttpResponse
from django.views.decorators.http import require_GET
from PIL import Image, ImageOps

from .models import Product

logger = logging.getLogger(__name__)

SITE_URL = 'https://collabo.co.in'
THUMB_SIZE = 128
MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024
FETCH_TIMEOUT = 8
THUMB_DIR = os.path.join(str(settings.MEDIA_ROOT), 'email_thumbs')


def _sources(product):
    """Every picture the product has, main image first."""
    out = [getattr(product, 'image', '') or '']
    extra = getattr(product, 'images', None)
    if isinstance(extra, list):
        out += [u for u in extra if isinstance(u, str)]
    return [u.strip() for u in out if u and u.strip()]


def _pick_source(product):
    for u in _sources(product):
        if u.startswith(('http://', 'https://', '//', '/media/', 'data:image/')):
            return u
    return ''


def thumb_url(product):
    """Public URL of the product's thumbnail, or '' if it has no usable picture.
    The ?v= part changes when the picture changes, so mail clients never show a stale one."""
    src = _pick_source(product)
    if not src:
        return ''
    ver = hashlib.sha1(src.encode('utf-8', 'ignore')).hexdigest()[:10]
    return f"{SITE_URL}/api/ecommerce/product-thumb/{product.id}/?v={ver}"


def _is_public_host(host):
    """Refuse to fetch anything that resolves to a private/internal address."""
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            return False
    return bool(infos)


def _download(url):
    if url.startswith('//'):
        url = 'https:' + url
    for _ in range(4):  # follow a few redirects, re-checking the host each time
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https') or not parsed.hostname or not _is_public_host(parsed.hostname):
            raise ValueError('blocked url')
        resp = requests.get(url, timeout=FETCH_TIMEOUT, stream=True, allow_redirects=False,
                            headers={'User-Agent': 'Mozilla/5.0 (compatible; CollaboThumbs/1.0)'})
        if resp.is_redirect or resp.status_code in (301, 302, 303, 307, 308):
            url = urljoin(url, resp.headers.get('Location', ''))
            resp.close()
            continue
        resp.raise_for_status()
        data = b''
        for chunk in resp.iter_content(65536):
            data += chunk
            if len(data) > MAX_DOWNLOAD_BYTES:
                raise ValueError('image too large')
        return data
    raise ValueError('too many redirects')


def _load_bytes(src):
    if src.startswith('data:image/'):
        return base64.b64decode(src.split(',', 1)[1])
    if src.startswith('/media/'):
        path = os.path.normpath(os.path.join(str(settings.MEDIA_ROOT), src[len('/media/'):]))
        if not path.startswith(os.path.normpath(str(settings.MEDIA_ROOT)) + os.sep):
            raise ValueError('bad path')
        with open(path, 'rb') as fh:
            return fh.read()
    return _download(src)


def _make_thumb(raw):
    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGBA')
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    else:
        img = img.convert('RGB')
    img = ImageOps.fit(img, (THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, 'JPEG', quality=82, optimize=True)
    return out.getvalue()


def _placeholder():
    img = Image.new('RGB', (THUMB_SIZE, THUMB_SIZE), (244, 244, 245))
    out = io.BytesIO()
    img.save(out, 'JPEG', quality=80)
    return out.getvalue()


@require_GET
def product_thumb(request, product_id):
    try:
        product = Product.objects.only('id', 'image', 'images').get(pk=product_id)
    except Product.DoesNotExist:
        raise Http404

    src = _pick_source(product)
    key = hashlib.sha1(src.encode('utf-8', 'ignore')).hexdigest()[:16]
    path = os.path.join(THUMB_DIR, f"{product.id}_{key}.jpg")

    data = None
    if src:
        if os.path.exists(path):
            with open(path, 'rb') as fh:
                data = fh.read()
        else:
            try:
                data = _make_thumb(_load_bytes(src))
                os.makedirs(THUMB_DIR, exist_ok=True)
                tmp = path + '.tmp'
                with open(tmp, 'wb') as fh:
                    fh.write(data)
                os.replace(tmp, path)
            except Exception as exc:
                logger.warning('Thumbnail for product %s failed: %s', product.id, exc)
                data = None

    if data is None:  # picture missing/unreachable: a neutral grey square, cached only briefly
        resp = HttpResponse(_placeholder(), content_type='image/jpeg')
        resp['Cache-Control'] = 'public, max-age=300'
        return resp

    resp = HttpResponse(data, content_type='image/jpeg')
    resp['Cache-Control'] = 'public, max-age=604800, immutable'
    return resp
