"""Flipkart India provider — official Flipkart Affiliate API (Fk-Affiliate-Id
/ Fk-Affiliate-Token headers), never HTML scraping.

Left as a documented placeholder: there is no Flipkart account with approved
Affiliate API access configured yet, and no official Python SDK to introspect
for a verified request/response shape (unlike Amazon — see amazon.py). Flipkart
issues exact endpoint paths and a Postman collection to affiliates only after
approval (apply at https://affiliate.flipkart.com/). Filling in the real
request here before that would mean guessing an endpoint shape from memory,
which risks calling something that doesn't exist or has changed — so this
returns a clear "not implemented" result instead of a real (and unverifiable)
HTTP call.

Once you have real docs, implement _fetch() using `requests` (already a
project dependency) against FLIPKART_API_BASE_URL with the
Fk-Affiliate-Id / Fk-Affiliate-Token headers, following the exact path your
approved dashboard documents.
"""

import logging

from django.conf import settings

from .base import CompetitorPriceProvider, CompetitorPriceResult

logger = logging.getLogger('pricing.providers.flipkart')


class FlipkartProvider(CompetitorPriceProvider):
    platform = 'flipkart'

    def __init__(self):
        self.affiliate_id = settings.FLIPKART_AFFILIATE_ID
        self.affiliate_token = settings.FLIPKART_AFFILIATE_TOKEN
        self.api_base_url = settings.FLIPKART_API_BASE_URL

    def is_configured(self) -> bool:
        return bool(self.affiliate_id and self.affiliate_token)

    def get_product_price(self, mapping) -> CompetitorPriceResult:
        if not self.is_configured():
            logger.info('Flipkart request skipped for product_id=%s: provider not configured', mapping.product_id)
            return CompetitorPriceResult.not_configured('Flipkart')

        logger.info(
            'Flipkart request: product_id=%s external_id=%s — fetch not implemented yet',
            mapping.product_id, mapping.external_product_id,
        )
        return CompetitorPriceResult.failure(
            'FlipkartProvider is configured but the real Affiliate API request is not implemented yet. '
            'Add the verified endpoint from your affiliate.flipkart.com dashboard docs to '
            'pricing/providers/flipkart.py before enabling auto pricing for Flipkart.'
        )
