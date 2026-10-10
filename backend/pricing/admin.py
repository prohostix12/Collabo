from django.contrib import admin

from .models import CompetitorLink, CompetitorPriceHistory


class CompetitorPriceHistoryInline(admin.TabularInline):
    model = CompetitorPriceHistory
    extra = 0
    can_delete = False
    readonly_fields = ('price', 'currency', 'in_stock', 'success', 'error_message', 'checked_at')
    ordering = ('-checked_at',)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(CompetitorLink)
class CompetitorLinkAdmin(admin.ModelAdmin):
    list_display = ('product', 'platform', 'is_active', 'last_price', 'last_in_stock', 'last_checked_at')
    list_filter = ('platform', 'is_active', 'last_in_stock')
    search_fields = ('product__name', 'product_url')
    autocomplete_fields = ('product',)
    readonly_fields = ('last_price', 'last_currency', 'last_in_stock', 'last_checked_at', 'last_error', 'created_at', 'updated_at')
    inlines = [CompetitorPriceHistoryInline]
