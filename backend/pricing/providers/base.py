"""Common interface every marketplace provider implements.

    CompetitorPriceProvider
           |
           +---- AmazonProvider   (pricing/providers/amazon.py)
           |
           +---- FlipkartProvider (pricing/providers/flipkart.py)
           |
           +---- <FutureProvider> (Myntra, Croma, ... — add later without
                  touching this file, the pricing engine, or the other
                  providers)

Adding a new marketplace later means: create a new subclass here, register it
in pricing/providers/registry.py, and add 'newplatform' to PLATFORM_CHOICES in
pricing/models.py. Nothing else in the system needs to change.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

logger = logging.getLogger('pricing.providers')

AVAILABLE = 'available'
UNAVAILABLE = 'unavailable'
UNKNOWN = 'unknown'


@dataclass
class CompetitorPriceResult:
    """Return type for every provider call. A provider must NEVER raise for
    expected failure modes (missing config, timeout, rate limit, product not
    found, malformed response) — it must return this with success=False and
    a clear error_message instead. That's what lets the pricing engine treat
    "Amazon failed, Flipkart succeeded" as a normal case rather than crashing
    the whole sync (see the ERROR HANDLING requirement)."""

    success: bool
    price: Optional[Decimal] = None
    original_price: Optional[Decimal] = None
    currency: str = 'INR'
    availability: str = UNKNOWN
    seller_info: str = ''
    product_url: str = ''
    error_message: str = ''

    @classmethod
    def not_configured(cls, platform: str) -> 'CompetitorPriceResult':
        return cls(
            success=False,
            error_message=f'{platform} provider is not configured (missing API credentials in .env).',
        )

    @classmethod
    def failure(cls, message: str) -> 'CompetitorPriceResult':
        return cls(success=False, error_message=message)


class CompetitorPriceProvider(ABC):
    """One instance per marketplace. Stateless beyond its own API client /
    credentials — safe to instantiate fresh per Celery task run."""

    #: must match a value in pricing.models.PLATFORM_CHOICES
    platform: str = None

    @abstractmethod
    def is_configured(self) -> bool:
        """True only if this provider has everything it needs to make a real
        API call. Checked before every fetch so an unconfigured provider is
        skipped cleanly instead of raising deep inside a Celery task."""
        raise NotImplementedError

    @abstractmethod
    def get_product_price(self, mapping) -> CompetitorPriceResult:
        """mapping: pricing.models.CompetitorProductMapping instance for this
        provider's platform. Must return a CompetitorPriceResult — see the
        docstring on that class for the success=False contract."""
        raise NotImplementedError
