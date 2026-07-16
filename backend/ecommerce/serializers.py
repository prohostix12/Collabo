from rest_framework import serializers
from django.conf import settings
from .models import Product, Cart, CartItem, Address, Order, OrderItem, Category, Brand, ProductReview, AffiliateCommission, StoreSettings, CustomerReview, ProductInfluencerMedia, SellerReview, SellerPayout, NewsletterSubscriber, Wishlist, CustomerReferralLink, WalletTransaction, WalletPayout

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name']

def _force_https(url):
    if isinstance(url, str) and url.startswith('http://'):
        return 'https://' + url[7:]
    return url

class ProductSerializer(serializers.ModelSerializer):
    seller_username = serializers.ReadOnlyField(source='seller.username')
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'seller_username', 'status', 'rejection_reason', 'name', 'category', 'brand',
            'price', 'discount_price', 'discount_percent', 'rating', 'reviews_count',
            'image', 'images', 'description', 'stock', 'delivery', 'specifications',
            'highlights', 'offers', 'seller_info', 'qa_section',
            'product_shipping_charge', 'commission_rate', 'link_discount_percent', 'created_at', 'updated_at'
        ]
        # status/rejection_reason are admin-controlled only — set via the approve/reject
        # actions on ProductViewSet, never directly through create/update payloads.
        read_only_fields = ['seller', 'discount_percent', 'status', 'rejection_reason']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = _force_https(data.get('image'))
        if isinstance(data.get('images'), list):
            data['images'] = [_force_https(u) for u in data['images']]
        return data

class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_details', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Cart
        fields = ['id', 'user', 'user_username', 'items', 'created_at', 'updated_at']
        read_only_fields = ['user']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'user', 'name', 'phone', 'street_address', 'city', 'district', 'state', 'postal_code', 'is_default']
        read_only_fields = ['user']

class OrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_details', 'price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address_details = AddressSerializer(source='address', read_only=True)
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'user', 'user_username', 'address', 'address_details',
            'total_amount', 'discount_amount', 'delivery_charge', 'final_amount',
            'payment_method', 'payment_status', 'status', 'items',
            'referral_code', 'referral_map', 'created_at', 'updated_at',
            'cancel_reason', 'cancel_comment', 'cancel_attachments', 'cancelled_at',
            'return_reason', 'return_comment', 'return_requested_at',
            'tracking_number', 'shipping_provider', 'shipped_at',
            'expected_delivery_date', 'sent_to_partner',
        ]
        read_only_fields = [
            'user', 'order_id', 'total_amount', 'discount_amount', 'delivery_charge',
            'final_amount', 'payment_status', 'cancelled_at', 'return_requested_at',
            'shipped_at'
        ]

class ProductReviewSerializer(serializers.ModelSerializer):
    influencer_username = serializers.ReadOnlyField(source='influencer.username')
    product_name = serializers.ReadOnlyField(source='product.name')
    referral_link = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'product_name', 'influencer', 'influencer_username', 'rating', 'comment', 'referral_code', 'referral_link', 'custom_discount_percent', 'custom_commission_rate', 'custom_price', 'created_at']
        read_only_fields = ['influencer', 'referral_code', 'referral_link']

    def get_referral_link(self, obj):
        return f"{settings.FRONTEND_URL}/?ref={obj.referral_code}&pid={obj.product.id}"

class CustomerReferralLinkSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.ReadOnlyField(source='product.image')
    link_discount_percent = serializers.ReadOnlyField(source='product.link_discount_percent')
    referred_via_username = serializers.ReadOnlyField(source='referred_via.username')
    referral_link = serializers.SerializerMethodField()

    class Meta:
        model = CustomerReferralLink
        fields = ['id', 'product', 'product_name', 'product_image', 'user', 'username', 'referral_code', 'referral_link', 'link_discount_percent', 'referred_via_username', 'created_at']
        read_only_fields = ['user', 'referral_code', 'referral_link', 'referred_via_username']

    def get_referral_link(self, obj):
        return f"{settings.FRONTEND_URL}/?ref={obj.referral_code}&pid={obj.product.id}"

class WalletTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'level', 'status', 'reason', 'product', 'product_name', 'order', 'created_at']

class WalletPayoutSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = WalletPayout
        fields = ['id', 'user', 'username', 'amount', 'status', 'account_holder_name', 'account_number',
                  'ifsc_code', 'bank_reference', 'admin_note', 'requested_at', 'processed_at']
        read_only_fields = ['user', 'status', 'bank_reference', 'admin_note', 'requested_at', 'processed_at']

class CustomerReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = CustomerReview
        fields = ['id', 'product', 'product_name', 'user', 'username', 'rating', 'comment', 'image', 'created_at']
        read_only_fields = ['user']

class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = [
            'ticker_text', 'ticker_coupon_highlight',
            'hero_badge_text', 'hero_headline', 'hero_subheadline',
            'hero_cta_primary', 'hero_cta_secondary',
            'category_images',
            'deals_product_ids', 'trending_product_ids',
            'trending_phones_title', 'trending_phones_subtitle', 'trending_phones_product_ids',
            'coupon_codes', 'testimonials',
            'footer_tagline', 'copyright_text',
            'hero_card_carousel_enabled', 'hero_card_slides',
            'trusted_partners', 'trusted_partners_title',
            'promo_cards',
            'shipping_charge', 'free_shipping_threshold', 'serviceable_pincodes',
            'updated_at'
        ]
        read_only_fields = ['updated_at']


class ProductInfluencerMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductInfluencerMedia
        fields = ['id', 'product', 'media_type', 'file', 'file_url', 'title', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class SellerReviewSerializer(serializers.ModelSerializer):
    buyer_username = serializers.ReadOnlyField(source='buyer.username')

    class Meta:
        model = SellerReview
        fields = ['id', 'buyer', 'buyer_username', 'seller', 'order', 'rating', 'comment', 'created_at']
        read_only_fields = ['buyer', 'created_at']


class SellerPayoutSerializer(serializers.ModelSerializer):
    seller_username = serializers.ReadOnlyField(source='seller.username')

    class Meta:
        model = SellerPayout
        fields = ['id', 'seller', 'seller_username', 'amount', 'status',
                  'bank_reference', 'admin_note', 'requested_at', 'processed_at']
        read_only_fields = ['seller', 'status', 'bank_reference', 'admin_note',
                            'requested_at', 'processed_at']


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'email', 'subscribed_at']

class WishlistSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_details', 'created_at']
        read_only_fields = ['created_at']
        read_only_fields = ['subscribed_at']