"""Maps a platform string (pricing.models.PLATFORM_CHOICES) to its provider
class. Adding a new marketplace later means: add the choice to PLATFORM_CHOICES
in pricing/models.py, create pricing/providers/<name>.py subclassing
CompetitorPriceProvider, and add one line here — nothing else changes."""

from .amazon import AmazonProvider
from .flipkart import FlipkartProvider

PROVIDER_REGISTRY = {
    'amazon': AmazonProvider,
    'flipkart': FlipkartProvider,
}


def get_provider(platform: str):
    """Returns a fresh provider instance for the given platform, or None if
    the platform isn't registered (should not happen for values that pass
    PLATFORM_CHOICES validation, but callers should handle None defensively)."""
    provider_class = PROVIDER_REGISTRY.get(platform)
    if provider_class is None:
        return None
    return provider_class()
