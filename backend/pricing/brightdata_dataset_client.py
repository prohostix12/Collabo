"""Client for Bright Data's Dataset API
(https://docs.brightdata.com/datasets/api) — trigger-and-poll collection of
pre-parsed Amazon/Flipkart product records, as opposed to
brightdata_client.py's Web Unlocker flow (raw HTML fetch + local parsing in
parsers.py). Each platform has its own dataset_id; both share one API key.

Flow: trigger_collection() starts a snapshot for a batch of product URLs,
poll_until_ready() blocks until Bright Data finishes scraping, fetch_snapshot()
downloads the resulting records. fetch_products() wraps all three for the
common "give me records for these URLs" case. Records come back already
parsed by Bright Data's own dataset schema — no HTML/BeautifulSoup involved.
"""

import logging
import time

import requests
from django.conf import settings

logger = logging.getLogger('pricing.brightdata_dataset')

TRIGGER_URL = 'https://api.brightdata.com/datasets/v3/trigger'
PROGRESS_URL = 'https://api.brightdata.com/datasets/v3/progress/{snapshot_id}'
SNAPSHOT_URL = 'https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}'

DONE_STATUSES = {'ready'}
FAILED_STATUSES = {'failed', 'error'}


class BrightDataDatasetError(Exception):
    """Raised for any non-2xx response, transport failure, or failed/timed-out snapshot."""


class BrightDataDatasetNotConfigured(Exception):
    """Raised when BRIGHTDATA_API_KEY or the platform's dataset ID is missing."""


def _dataset_id(platform: str) -> str:
    return {
        'amazon': settings.BRIGHT_DATA_AMAZON_DATASET_ID,
        'flipkart': settings.BRIGHT_DATA_FLIPKART_DATASET_ID,
    }.get(platform, '')


def is_configured(platform: str) -> bool:
    return bool(settings.BRIGHTDATA_API_KEY and _dataset_id(platform))


def _headers() -> dict:
    return {
        'Authorization': f'Bearer {settings.BRIGHTDATA_API_KEY}',
        'Content-Type': 'application/json',
    }


def trigger_collection(platform: str, urls: list) -> str:
    """Starts a Dataset API collection for `urls` on `platform` (amazon|flipkart).
    Returns the snapshot_id used to poll for and fetch results."""

    dataset_id = _dataset_id(platform)
    if not is_configured(platform):
        raise BrightDataDatasetNotConfigured(
            f'BRIGHTDATA_API_KEY / dataset id for platform "{platform}" are not set'
        )

    try:
        response = requests.post(
            TRIGGER_URL,
            headers=_headers(),
            params={'dataset_id': dataset_id, 'include_errors': 'true'},
            json=[{'url': url} for url in urls],
            timeout=settings.BRIGHTDATA_TIMEOUT_SECS,
        )
    except requests.RequestException as exc:
        raise BrightDataDatasetError(f'Bright Data trigger request failed: {exc}') from exc

    if response.status_code != 200:
        raise BrightDataDatasetError(
            f'Bright Data trigger returned HTTP {response.status_code}: {response.text[:300]}'
        )

    snapshot_id = response.json().get('snapshot_id')
    if not snapshot_id:
        raise BrightDataDatasetError(f'Bright Data trigger response had no snapshot_id: {response.text[:300]}')

    return snapshot_id


def get_snapshot_status(snapshot_id: str) -> str:
    try:
        response = requests.get(
            PROGRESS_URL.format(snapshot_id=snapshot_id),
            headers=_headers(),
            timeout=settings.BRIGHTDATA_TIMEOUT_SECS,
        )
    except requests.RequestException as exc:
        raise BrightDataDatasetError(f'Bright Data progress request failed: {exc}') from exc

    if response.status_code != 200:
        raise BrightDataDatasetError(
            f'Bright Data progress returned HTTP {response.status_code}: {response.text[:300]}'
        )

    return response.json().get('status', 'unknown')


def poll_until_ready(snapshot_id: str, poll_interval_secs: int = 5, max_wait_secs: int = 300) -> None:
    """Blocks until `snapshot_id` reaches a terminal status. Raises
    BrightDataDatasetError on failure or timeout. Meant to be called from a
    Celery task, not a request/response cycle — it's a synchronous wait by
    design."""

    waited = 0
    while waited < max_wait_secs:
        status = get_snapshot_status(snapshot_id)
        if status in DONE_STATUSES:
            return
        if status in FAILED_STATUSES:
            raise BrightDataDatasetError(f'Bright Data snapshot {snapshot_id} failed (status={status})')
        time.sleep(poll_interval_secs)
        waited += poll_interval_secs

    raise BrightDataDatasetError(f'Bright Data snapshot {snapshot_id} did not finish within {max_wait_secs}s')


def fetch_snapshot(snapshot_id: str) -> list:
    """Downloads the finished snapshot's records — one dict per input URL,
    shaped by the dataset's own schema (already-parsed price, availability,
    etc.; no local HTML parsing needed)."""

    try:
        response = requests.get(
            SNAPSHOT_URL.format(snapshot_id=snapshot_id),
            headers=_headers(),
            params={'format': 'json'},
            timeout=settings.BRIGHTDATA_TIMEOUT_SECS,
        )
    except requests.RequestException as exc:
        raise BrightDataDatasetError(f'Bright Data snapshot request failed: {exc}') from exc

    if response.status_code != 200:
        raise BrightDataDatasetError(
            f'Bright Data snapshot returned HTTP {response.status_code}: {response.text[:300]}'
        )

    return response.json()


def fetch_products(platform: str, urls: list, poll_interval_secs: int = 5, max_wait_secs: int = 300) -> list:
    """Convenience wrapper: trigger a collection for `urls` on `platform`,
    block until Bright Data finishes, and return the parsed records. Raises
    BrightDataDatasetNotConfigured / BrightDataDatasetError — callers are
    responsible for catching these, same contract as brightdata_client.fetch_html()."""

    snapshot_id = trigger_collection(platform, urls)
    poll_until_ready(snapshot_id, poll_interval_secs=poll_interval_secs, max_wait_secs=max_wait_secs)
    return fetch_snapshot(snapshot_id)
