from django.db import models

from ecommerce.models import Product

PLATFORM_CHOICES = (
    ('amazon', 'Amazon India'),
    ('flipkart', 'Flipkart India'),
)


class CompetitorLink(models.Model):
    """One competitor product URL (Amazon or Flipkart) mapped to a Collabo
    product. Also caches the most recent fetch result so the comparison API
    can answer without joining against CompetitorPriceHistory."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='competitor_links')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    product_url = models.URLField(max_length=1000)
    is_active = models.BooleanField(default=True, help_text='Uncheck to pause price checks without deleting the mapping.')

    # Cached last-fetch result — updated by pricing.tasks.sync_competitor_prices.
    last_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    last_currency = models.CharField(max_length=3, default='INR')
    last_in_stock = models.BooleanField(null=True, blank=True, help_text='Null = unknown (not yet checked, or last check failed).')
    last_checked_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'platform')
        indexes = [
            models.Index(fields=['product', 'platform']),
        ]

    def __str__(self):
        return f'{self.product.name} — {self.get_platform_display()}'


class CompetitorPriceHistory(models.Model):
    """One point-in-time price check result for a CompetitorLink. Append-only —
    rows are never edited or deleted by the sync job, giving a full price
    history over time."""

    link = models.ForeignKey(CompetitorLink, on_delete=models.CASCADE, related_name='price_history')
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='INR')
    in_stock = models.BooleanField(null=True, blank=True)
    success = models.BooleanField(default=True, help_text='False if the fetch/parse failed — price/in_stock are null in that case.')
    error_message = models.TextField(blank=True, default='')
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Competitor price history'
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['link', '-checked_at']),
        ]

    def __str__(self):
        return f'{self.link} — {self.price} @ {self.checked_at:%Y-%m-%d %H:%M}'
