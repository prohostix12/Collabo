from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CartViewSet, AddressViewSet, OrderViewSet, WishlistViewSet,
    CategoryViewSet, BrandViewSet, ProductReviewViewSet, CustomerReviewViewSet,
    PlatformSettingsView, StoreSettingsView, check_pincode, AdminAffiliatesView,
    AdminUpdateAffiliateRateView, RecordReferralClickView, ResolveReferralView,
    AdminAnalyticsView, create_razorpay_order, verify_razorpay_payment, razorpay_webhook,
    BroadcastOfferView,
    upload_influencer_media, list_influencer_media, delete_influencer_media,
    import_shopify_csv,
    SellerStorefrontView, seller_reviews,
    SellerEarningsView, seller_withdraw, SellerPayoutHistoryView,
    AdminPayoutListView, admin_process_payout,
    NewsletterSubscribeView,
    NewsletterBroadcastView,
    gupshup_webhook,
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='products')
router.register('cart', CartViewSet, basename='cart')
router.register('addresses', AddressViewSet, basename='addresses')
router.register('orders', OrderViewSet, basename='orders')
router.register('categories', CategoryViewSet, basename='categories')
router.register('brands', BrandViewSet, basename='brands')
router.register('reviews', ProductReviewViewSet, basename='reviews')
router.register('customer-reviews', CustomerReviewViewSet, basename='customer-reviews')
router.register('wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('settings/', PlatformSettingsView.as_view(), name='platform-settings'),
    path('store-settings/', StoreSettingsView.as_view(), name='store-settings'),
    path('check-pincode/', check_pincode, name='check-pincode'),
    path('admin/affiliates/', AdminAffiliatesView.as_view(), name='admin-affiliates'),
    path('admin/affiliates/<int:pk>/rates/', AdminUpdateAffiliateRateView.as_view(), name='admin-affiliates-rates'),
    path('track-click/', RecordReferralClickView.as_view(), name='track-referral-click'),
    path('resolve-referral/', ResolveReferralView.as_view(), name='resolve-referral'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/broadcast-offer/', BroadcastOfferView.as_view(), name='broadcast-offer'),
    path('razorpay/create-order/', create_razorpay_order, name='razorpay-create-order'),
    path('razorpay/verify-payment/', verify_razorpay_payment, name='razorpay-verify-payment'),
    path('razorpay/webhook/', razorpay_webhook, name='razorpay-webhook'),
    path('products/<int:product_id>/influencer-media/', list_influencer_media, name='list-influencer-media'),
    path('products/<int:product_id>/influencer-media/upload/', upload_influencer_media, name='upload-influencer-media'),
    path('influencer-media/<int:media_id>/delete/', delete_influencer_media, name='delete-influencer-media'),
    path('products/import-csv/', import_shopify_csv, name='import-shopify-csv'),
    # Seller storefront & reviews
    path('sellers/<int:seller_id>/storefront/', SellerStorefrontView.as_view(), name='seller-storefront'),
    path('sellers/<int:seller_id>/reviews/', seller_reviews, name='seller-reviews'),
    # Seller earnings & payouts
    path('seller/earnings/', SellerEarningsView.as_view(), name='seller-earnings'),
    path('seller/withdraw/', seller_withdraw, name='seller-withdraw'),
    path('seller/payouts/', SellerPayoutHistoryView.as_view(), name='seller-payouts'),
    # Admin payout management
    path('admin/seller-payouts/', AdminPayoutListView.as_view(), name='admin-seller-payouts'),
    path('admin/seller-payouts/<int:payout_id>/process/', admin_process_payout, name='admin-process-payout'),
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view(), name='newsletter-subscribe'),
    path('newsletter/broadcast/', NewsletterBroadcastView.as_view(), name='newsletter-broadcast'),
    path('gupshup/webhook/', gupshup_webhook, name='gupshup-webhook'),
    path('', include(router.urls)),
]
