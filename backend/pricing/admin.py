from django.contrib import admin

from .models import (
    CompetitorPrice,
    CompetitorProductMapping,
    PendingPriceApproval,
    PriceChangeHistory,
    PricingSyncSettings,
    ProductPricingConfig,
)


@admin.register(ProductPricingConfig)
class ProductPricingConfigAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'auto_pricing_enabled', 'pricing_strategy',
        'minimum_selling_price', 'minimum_margin_percentage',
        'max_auto_decrease_percent', 'max_auto_increase_percent',
    )
    list_filter = ('auto_pricing_enabled', 'pricing_strategy')
    search_fields = ('product__name',)


@admin.register(CompetitorProductMapping)
class CompetitorProductMappingAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'platform', 'external_product_id',
        'match_method', 'is_verified', 'is_active', 'updated_at',
    )
    list_filter = ('platform', 'match_method', 'is_verified', 'is_active')
    search_fields = ('product__name', 'external_product_id')
    actions = ['mark_verified']

    @admin.action(description='Mark selected mappings as verified')
    def mark_verified(self, request, queryset):
        queryset.update(is_verified=True)


@admin.register(CompetitorPrice)
class CompetitorPriceAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'platform', 'price', 'availability',
        'fetch_succeeded', 'fetched_at',
    )
    list_filter = ('platform', 'availability', 'fetch_succeeded')
    search_fields = ('product__name', 'external_product_id')


@admin.register(PriceChangeHistory)
class PriceChangeHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'old_price', 'new_price', 'marketplace',
        'update_type', 'created_at',
    )
    list_filter = ('marketplace', 'update_type')
    search_fields = ('product__name', 'reason')


@admin.register(PendingPriceApproval)
class PendingPriceApprovalAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'current_price', 'suggested_price',
        'change_percent', 'status', 'reviewed_by', 'created_at',
    )
    list_filter = ('status',)
    search_fields = ('product__name',)


@admin.register(PricingSyncSettings)
class PricingSyncSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'global_auto_pricing_enabled', 'sync_interval_minutes',
        'stale_price_threshold_minutes', 'last_sync_completed_at',
    )

    def has_add_permission(self, request):
        # Singleton row only — created lazily via get_settings().
        return not PricingSyncSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
