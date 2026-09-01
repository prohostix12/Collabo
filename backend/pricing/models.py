from django.conf import settings
from django.db import models

from ecommerce.models import Product

# Platform choices shared across mapping/price/history models. Amazon India and
# Flipkart India only for now; new marketplaces are added here without touching
# the provider interface or pricing engine (see pricing/providers/).
PLATFORM_CHOICES = (
    ('amazon', 'Amazon India'),
    ('flipkart', 'Flipkart India'),
)


class ProductPricingConfig(models.Model):
    """Per-product dynamic pricing configuration. Kept separate from
    ecommerce.Product (OneToOne) instead of adding columns there, so the
    existing Product model/serializers/admin stay untouched."""

    STRATEGY_MATCH_LOWEST = 'match_lowest'
    STRATEGY_UNDERCUT_AMOUNT = 'undercut_amount'
    STRATEGY_UNDERCUT_PERCENT = 'undercut_percent'
    STRATEGY_MATCH_AVERAGE = 'match_average'
    STRATEGY_KEEP_CURRENT = 'keep_current'
    STRATEGY_CHOICES = (
        (STRATEGY_MATCH_LOWEST, 'Match lowest competitor'),
        (STRATEGY_UNDERCUT_AMOUNT, 'Stay below lowest competitor by fixed amount'),
        (STRATEGY_UNDERCUT_PERCENT, 'Stay below lowest competitor by percentage'),
        (STRATEGY_MATCH_AVERAGE, 'Match average competitor price'),
        (STRATEGY_KEEP_CURRENT, 'Keep current price (monitoring only)'),
    )

    product = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name='pricing_config'
    )
    auto_pricing_enabled = models.BooleanField(default=False)

    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    minimum_selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    minimum_margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    pricing_strategy = models.CharField(
        max_length=20, choices=STRATEGY_CHOICES, default=STRATEGY_KEEP_CURRENT
    )
    undercut_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    undercut_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    max_auto_decrease_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    max_auto_increase_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product Pricing Config'
        verbose_name_plural = 'Product Pricing Configs'

    def __str__(self):
        return f'Pricing config: {self.product.name}'


class CompetitorProductMapping(models.Model):
    """Maps a Collabo product to its listing on a competitor marketplace.
    Admin-verified mappings are the primary matching mechanism, since
    ecommerce.Product has no SKU/GTIN/barcode field to match on automatically."""

    MATCH_GTIN = 'gtin'
    MATCH_BRAND_MPN = 'brand_mpn'
    MATCH_SKU = 'sku'
    MATCH_EXTERNAL_ID = 'external_id'
    MATCH_NORMALIZED_NAME = 'normalized_name'
    MATCH_MANUAL = 'manual'
    MATCH_METHOD_CHOICES = (
        (MATCH_GTIN, 'GTIN / UPC / EAN'),
        (MATCH_BRAND_MPN, 'Brand + Manufacturer Part Number'),
        (MATCH_SKU, 'SKU mapping'),
        (MATCH_EXTERNAL_ID, 'Marketplace product ID (ASIN / Flipkart ID)'),
        (MATCH_NORMALIZED_NAME, 'Normalized name + brand + variant'),
        (MATCH_MANUAL, 'Manual admin mapping'),
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='competitor_mappings'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    external_product_id = models.CharField(
        max_length=255, help_text='Amazon ASIN or Flipkart product/FSN ID'
    )
    external_url = models.URLField(max_length=1000, blank=True)
    match_method = models.CharField(
        max_length=20, choices=MATCH_METHOD_CHOICES, default=MATCH_MANUAL
    )
    is_verified = models.BooleanField(
        default=False,
        help_text='Must be verified by an admin before this mapping is used for pricing.',
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Competitor Product Mapping'
        verbose_name_plural = 'Competitor Product Mappings'
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'platform'],
                name='unique_product_platform_mapping',
            ),
            models.UniqueConstraint(
                fields=['platform', 'external_product_id'],
                name='unique_platform_external_id',
            ),
        ]

    def __str__(self):
        return f'{self.product.name} -> {self.get_platform_display()}:{self.external_product_id}'


class CompetitorPrice(models.Model):
    """A single fetched price snapshot for a competitor listing. New rows are
    inserted on every sync (never overwritten) so latest-per-platform can be
    queried by ordering on fetched_at; this also gives us history for free."""

    AVAILABLE = 'available'
    UNAVAILABLE = 'unavailable'
    UNKNOWN = 'unknown'
    AVAILABILITY_CHOICES = (
        (AVAILABLE, 'Available'),
        (UNAVAILABLE, 'Unavailable'),
        (UNKNOWN, 'Unknown'),
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='competitor_prices'
    )
    mapping = models.ForeignKey(
        CompetitorProductMapping, on_delete=models.CASCADE, related_name='price_records'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    external_product_id = models.CharField(max_length=255)

    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    original_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='INR')
    availability = models.CharField(
        max_length=20, choices=AVAILABILITY_CHOICES, default=UNKNOWN
    )
    seller_info = models.CharField(max_length=255, blank=True)
    product_url = models.URLField(max_length=1000, blank=True)

    fetch_succeeded = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)

    fetched_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Competitor Price'
        verbose_name_plural = 'Competitor Prices'
        ordering = ['-fetched_at']
        indexes = [
            models.Index(fields=['product', 'platform', '-fetched_at']),
        ]

    def __str__(self):
        return f'{self.get_platform_display()} price for {self.product.name}: {self.price}'


class PriceChangeHistory(models.Model):
    """Append-only audit log of every automatic Collabo price change. Rows are
    never edited or deleted by application code."""

    AUTOMATIC = 'automatic'
    MANUAL_APPROVED = 'manual_approved'
    ADMIN_OVERRIDE = 'admin_override'
    UPDATE_TYPE_CHOICES = (
        (AUTOMATIC, 'Automatic'),
        (MANUAL_APPROVED, 'Manually approved'),
        (ADMIN_OVERRIDE, 'Admin override'),
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='price_history'
    )
    old_price = models.DecimalField(max_digits=12, decimal_places=2)
    new_price = models.DecimalField(max_digits=12, decimal_places=2)
    previous_competitor_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    new_competitor_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    marketplace = models.CharField(max_length=20, choices=PLATFORM_CHOICES, blank=True)
    reason = models.TextField()
    update_type = models.CharField(
        max_length=20, choices=UPDATE_TYPE_CHOICES, default=AUTOMATIC
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Price Change History'
        verbose_name_plural = 'Price Change History'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.name}: {self.old_price} -> {self.new_price} ({self.created_at:%Y-%m-%d %H:%M})'


class PendingPriceApproval(models.Model):
    """Created instead of an automatic update whenever a calculated price
    change exceeds the configured max increase/decrease. Requires explicit
    admin approval or rejection."""

    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='pending_price_approvals'
    )
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    suggested_price = models.DecimalField(max_digits=12, decimal_places=2)
    change_percent = models.DecimalField(max_digits=6, decimal_places=2)
    lowest_competitor_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reason = models.TextField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pricing_approvals_reviewed',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pending Price Approval'
        verbose_name_plural = 'Pending Price Approvals'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.name}: {self.current_price} -> {self.suggested_price} [{self.status}]'


class PricingSyncSettings(models.Model):
    """Singleton row for global dynamic-pricing settings, mirroring the
    ecommerce.StoreSettings get_settings()/pk=1 pattern."""

    global_auto_pricing_enabled = models.BooleanField(default=True)
    sync_interval_minutes = models.PositiveIntegerField(
        default=60,
        help_text='Informational for now; the actual Celery Beat schedule is set in code (see STEP 5).',
    )
    stale_price_threshold_minutes = models.PositiveIntegerField(
        default=180,
        help_text='Competitor prices older than this are ignored by the pricing engine.',
    )
    last_sync_started_at = models.DateTimeField(null=True, blank=True)
    last_sync_completed_at = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pricing Sync Settings'
        verbose_name_plural = 'Pricing Sync Settings'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Pricing Sync Settings'
