import logging

from celery import shared_task

logger = logging.getLogger('pricing.tasks')


@shared_task(name='pricing.tasks.sync_competitor_prices')
def sync_competitor_prices():
    """Scheduled every 12h from influencer_platform/celery.py. Checks every
    active CompetitorLink via Bright Data and records the result — read-only
    with respect to Collabo's own product prices."""

    from .services import sync_all_active_links

    return sync_all_active_links()
