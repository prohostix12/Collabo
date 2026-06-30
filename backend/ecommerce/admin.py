from django.contrib import admin
from .models import Product, CustomerReview, ProductReview, SellerReview, Order
from .tasks import broadcast_offer

@admin.register(CustomerReview)
class CustomerReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__username', 'comment')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'seller')
    search_fields = ('name', 'category', 'brand')
    list_filter = ('category', 'brand')

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'influencer', 'rating', 'created_at')

@admin.register(SellerReview)
class SellerReviewAdmin(admin.ModelAdmin):
    list_display = ('seller', 'buyer', 'order', 'rating', 'created_at')

# New Order admin with bulk offer action
@admin.action(description='Send bulk promotional offer to users of selected orders')
def send_bulk_offer(modeladmin, request, queryset):
    # Extract unique user IDs from selected orders
    user_ids = list(queryset.values_list('user_id', flat=True).distinct())
    # Placeholder coupon details – replace with real values as needed
    coupon_code = 'PROMO2026'
    discount_pct = 15
    description = 'Special 15% off on all items! Use code PROMO2026.'
    broadcast_offer.delay(coupon_code, discount_pct, description, user_ids)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'user', 'status', 'payment_status', 'total_amount', 'created_at')
    list_filter = ('status', 'payment_status')
    search_fields = ('order_id', 'user__username')
    actions = [send_bulk_offer]
