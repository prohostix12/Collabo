"""Amazon India provider — Amazon Creators API (the current name for what was
Product Advertising API 5.0; NOT the deprecated older PA-API/ECS interface).

Verified against the installed `python-amazon-paapi==6.3.0` package, whose
main entry point is `amazon_creatorsapi.AmazonCreatorsApi` (its own
`amazon_paapi` module is a deprecated compatibility shim that warns on
import — we deliberately import from `amazon_creatorsapi` directly).

Credentials come from an approved Amazon Associates (amazon.in) account with
Creators API access granted from the Associates Central dashboard
(Tools -> Product Advertising API). Signing/transport is handled entirely by
the SDK; this file never touches raw HTTP or AWS SigV4.
"""

import logging
from decimal import Decimal, InvalidOperation

from django.conf import settings

from .base import AVAILABLE, UNAVAILABLE, UNKNOWN, CompetitorPriceProvider, CompetitorPriceResult

logger = logging.getLogger('pricing.providers.amazon')

# Imported lazily inside the class so a missing/broken SDK install can't
# break Django startup for the whole project — only this provider's
# is_configured()/get_product_price() would fail, gracefully.


class AmazonProvider(CompetitorPriceProvider):
    platform = 'amazon'

    def __init__(self):
        self.access_key = settings.AMAZON_PAAPI_ACCESS_KEY
        self.secret_key = settings.AMAZON_PAAPI_SECRET_KEY
        self.partner_tag = settings.AMAZON_PAAPI_PARTNER_TAG
        self.country = settings.AMAZON_PAAPI_COUNTRY
        self.version = settings.AMAZON_PAAPI_VERSION
        self._client = None

    def is_configured(self) -> bool:
        return bool(self.access_key and self.secret_key and self.partner_tag)

    def _get_client(self):
        if self._client is None:
            from amazon_creatorsapi import AmazonCreatorsApi, Country

            country = getattr(Country, self.country, Country.IN)
            self._client = AmazonCreatorsApi(
                credential_id=self.access_key,
                credential_secret=self.secret_key,
                version=self.version,
                tag=self.partner_tag,
                country=country,
            )
        return self._client

    def get_product_price(self, mapping) -> CompetitorPriceResult:
        if not self.is_configured():
            logger.info('Amazon request skipped for product_id=%s: provider not configured', mapping.product_id)
            return CompetitorPriceResult.not_configured('Amazon')

        asin = mapping.external_product_id
        logger.info('Amazon request: ASIN=%s product_id=%s', asin, mapping.product_id)

        try:
            from amazon_creatorsapi.models import GetItemsResource

            client = self._get_client()
            items = client.get_items(
                [asin],
                resources=[
                    GetItemsResource.ITEM_INFO_DOT_TITLE,
                    GetItemsResource.OFFERS_V2_DOT_LISTINGS_DOT_PRICE,
                    GetItemsResource.OFFERS_V2_DOT_LISTINGS_DOT_AVAILABILITY,
                    GetItemsResource.OFFERS_V2_DOT_LISTINGS_DOT_MERCHANT_INFO,
                ],
            )
        except Exception as exc:  # noqa: BLE001 — any SDK/network error must degrade gracefully, never crash the sync
            logger.error('Amazon response error for ASIN=%s: %s', asin, exc)
            return CompetitorPriceResult.failure(f'Amazon API error: {exc}')

        if not items:
            logger.info('Amazon response: ASIN=%s not found', asin)
            return CompetitorPriceResult.failure('Product not found on Amazon (invalid or delisted ASIN).')

        item = items[0]
        product_url = f'https://www.amazon.in/dp/{asin}'
        listings = item.offers_v2.listings if getattr(item, 'offers_v2', None) else None

        if not listings:
            logger.info('Amazon response: ASIN=%s has no active offers (unavailable)', asin)
            return CompetitorPriceResult(success=True, availability=UNAVAILABLE, product_url=product_url)

        listing = listings[0]

        price = None
        currency = 'INR'
        if listing.price and listing.price.money and listing.price.money.amount is not None:
            try:
                price = Decimal(str(listing.price.money.amount))
            except InvalidOperation:
                price = None
            currency = listing.price.money.currency or 'INR'

        availability_type = ''
        if listing.availability and listing.availability.type:
            availability_type = listing.availability.type.lower()

        if 'out' in availability_type:
            availability = UNAVAILABLE
        elif price is not None:
            availability = AVAILABLE
        else:
            availability = UNKNOWN

        seller_info = ''
        if listing.merchant_info and listing.merchant_info.name:
            seller_info = listing.merchant_info.name

        logger.info('Amazon price for ASIN=%s: %s %s (%s)', asin, price, currency, availability)

        return CompetitorPriceResult(
            success=True,
            price=price,
            currency=currency,
            availability=availability,
            seller_info=seller_info,
            product_url=product_url,
        )
