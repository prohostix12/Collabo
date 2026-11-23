"""Lightweight, dependency-free device/location detection for session tracking.
Deliberately regex-based (not the full `user-agents` package) so no new pip
dependency has to be deployed — covers the common real-world cases well enough
for display purposes; it is not used for any security decision by itself."""
import logging
import re

import requests

logger = logging.getLogger(__name__)

_MOBILE_OS = [
    (re.compile(r'iPhone|iPad|iPod', re.I), 'tablet', 'iOS'),
    (re.compile(r'Android', re.I), 'mobile', 'Android'),
]
_DESKTOP_OS = [
    (re.compile(r'Windows NT 10', re.I), 'Windows 10/11'),
    (re.compile(r'Windows NT 6\.3', re.I), 'Windows 8.1'),
    (re.compile(r'Windows NT 6\.2', re.I), 'Windows 8'),
    (re.compile(r'Windows NT 6\.1', re.I), 'Windows 7'),
    (re.compile(r'Windows', re.I), 'Windows'),
    (re.compile(r'Mac OS X', re.I), 'macOS'),
    (re.compile(r'Linux', re.I), 'Linux'),
]
_BROWSERS = [
    (re.compile(r'Edg/', re.I), 'Edge'),
    (re.compile(r'OPR/|Opera', re.I), 'Opera'),
    (re.compile(r'Chrome/', re.I), 'Chrome'),
    (re.compile(r'CriOS/', re.I), 'Chrome'),
    (re.compile(r'FxiOS/|Firefox/', re.I), 'Firefox'),
    (re.compile(r'Safari/', re.I), 'Safari'),
]


def parse_user_agent(ua_string):
    """Returns (device_type, browser, os) best-effort from a User-Agent header."""
    ua = ua_string or ''

    device_type = 'desktop'
    os_name = 'Unknown OS'
    for pattern, dtype, name in _MOBILE_OS:
        if pattern.search(ua):
            device_type = dtype
            os_name = name
            break
    else:
        for pattern, name in _DESKTOP_OS:
            if pattern.search(ua):
                os_name = name
                break

    browser = 'Unknown browser'
    # Order matters: Edge/Opera/CriOS/FxiOS strings also contain "Chrome"/"Safari"
    # tokens, so the more specific checks above must run first.
    for pattern, name in _BROWSERS:
        if pattern.search(ua):
            browser = name
            break

    return device_type, browser, os_name


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


_PRIVATE_IP = re.compile(
    r'^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|localhost$)'
)


def get_location(ip_address):
    """Best-effort city/country lookup. Never raises — a failed/slow lookup
    just means an empty location string, not a broken login."""
    if not ip_address or _PRIVATE_IP.match(ip_address):
        return 'Local network'
    try:
        resp = requests.get(
            f'http://ip-api.com/json/{ip_address}',
            params={'fields': 'status,city,regionName,country'},
            timeout=1.5,
        )
        data = resp.json()
        if data.get('status') == 'success':
            parts = [p for p in [data.get('city'), data.get('regionName'), data.get('country')] if p]
            return ', '.join(parts)
    except Exception as e:
        logger.debug('IP geolocation lookup failed for %s: %s', ip_address, e)
    return ''
