from django.db import models
from accounts.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='📦')

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount_percent = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    reviews_count = models.PositiveIntegerField(default=0)
    image = models.TextField(blank=True, help_text="Main product image URL or base64 data")
    images = models.JSONField(default=list, blank=True, help_text="List of extra image URLs or base64 data")
    description = models.TextField()
    stock = models.PositiveIntegerField(default=0)
    delivery = models.CharField(max_length=255, default='Free delivery by Tomorrow')
    specifications = models.JSONField(default=list, blank=True, help_text="List of specifications [{name: '', value: ''}]")
    highlights = models.JSONField(default=list, blank=True, help_text="List of highlights")
    offers = models.JSONField(default=list, blank=True, help_text="List of offers")
    seller_info = models.TextField(blank=True, help_text="Seller information and policies")
    qa_section = models.JSONField(default=list, blank=True, help_text="List of Q&A [{q: '', a: ''}]")
    product_shipping_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Shipping charge for this product in INR. 0 means free shipping.")
    commission_rate = models.PositiveIntegerField(default=10, help_text="Commission percentage rate for influencers")
    link_discount_percent = models.PositiveIntegerField(default=0, help_text="Discount percentage buyers get when purchasing via an influencer link")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calculate discount percent if discount price is provided
        if self.discount_price and self.price:
            if self.discount_price > self.price:
                self.discount_percent = 0
                self.discount_price = self.price
            else:
                self.discount_percent = int(round((1 - (self.discount_price / self.price)) * 100))
        else:
            self.discount_percent = 0
            self.discount_price = self.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.brand} (${self.price})"

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart: {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} x {self.quantity} in {self.cart}"

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    street_address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    is_default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_default:
            # Mark all other addresses of this user as not default
            Address.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.city}, {self.state}"

class Order(models.Model):
    # ... existing fields remain unchanged

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('return_requested', 'Return Requested'),
        ('returned', 'Returned'),
        ('refunded', 'Refunded'),
        ('return_rejected', 'Return Rejected'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    delivery_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, default='upi')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    order_id = models.CharField(max_length=100, unique=True)
    referral_code = models.CharField(max_length=100, null=True, blank=True)
    referral_map = models.JSONField(default=dict, blank=True, help_text="Per-product referral codes: {product_id: referral_code}")
    
    # Cancellation Details
    cancel_reason = models.CharField(max_length=255, null=True, blank=True)
    cancel_comment = models.TextField(null=True, blank=True)
    cancel_attachments = models.JSONField(default=list, blank=True, help_text="List of attachment URLs submitted with cancellation")
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Return Details
    return_reason = models.CharField(max_length=255, null=True, blank=True)
    return_comment = models.TextField(null=True, blank=True)
    return_requested_at = models.DateTimeField(null=True, blank=True)

    # Shipping & Tracking
    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    shipping_provider = models.CharField(max_length=100, null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    shiprocket_order_id = models.CharField(max_length=50, null=True, blank=True)
    shiprocket_shipment_id = models.CharField(max_length=50, null=True, blank=True)

    # Delivery Scheduling & Notification Flags
    expected_delivery_date = models.DateField(null=True, blank=True, help_text="Expected delivery date (auto-set on order creation)")
    pre_delivery_notified = models.BooleanField(default=False, help_text="WhatsApp reminder sent the day before delivery")
    delivery_day_notified = models.BooleanField(default=False, help_text="WhatsApp message sent on delivery day")
    
    # Partner/Seller fulfillment tracking
    sent_to_partner = models.BooleanField(default=False, help_text="Indicates if order details were sent to partner/seller")

    # Delivery OTP
    delivery_otp = models.CharField(max_length=6, null=True, blank=True)
    delivery_otp_sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_id} - {self.user.username}"

# Signal handling for WhatsApp notifications
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .tasks import notify_order_placed_async, notify_order_delivered_async

@receiver(post_save, sender=Order)
def order_post_save(sender, instance, created, **kwargs):
    """Trigger notifications on order creation and delivery."""
    # Celery (async) — safe even if Redis is down
    try:
        if created:
            notify_order_placed_async.delay(instance.id)
        elif instance.status == 'delivered':
            notify_order_delivered_async.delay(instance.id)
    except Exception:
        pass

    # Gupshup WhatsApp — direct, no Redis needed
    try:
        from .gupshup import notify_order_placed, notify_order_delivered, notify_order_shipped
        if created:
            notify_order_placed(instance)
        elif instance.status == 'shipped':
            notify_order_shipped(instance)
        elif instance.status == 'delivered':
            notify_order_delivered(instance)
    except Exception:
        pass


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.product.name} x {self.quantity} in Order {self.order.order_id}"

class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_reviews_list')
    influencer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.PositiveIntegerField(default=5)
    comment = models.TextField()
    referral_code = models.CharField(max_length=100, unique=True, blank=True)
    custom_discount_percent = models.PositiveIntegerField(null=True, blank=True, help_text="Override buyer discount percent for this specific link")
    custom_commission_rate = models.PositiveIntegerField(null=True, blank=True, help_text="Override influencer commission percent for this specific link")
    custom_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Influencer's custom price for buyers using this link. Overrides the product's discount price.")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import uuid
            self.referral_code = f"ref-{self.influencer.id}-{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Review by {self.influencer.username} for {self.product.name} - Rating {self.rating}"

class AffiliateCommission(models.Model):
    influencer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='affiliate_commissions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='commissions')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default='completed')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commission of ${self.amount} for {self.influencer.username} (Order: {self.order.order_id})"

class CustomerReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='customer_reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_reviews')
    rating = models.PositiveIntegerField(default=5)
    comment = models.TextField()
    image = models.TextField(blank=True, default='', help_text="Review image URL or base64 data")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name} - Rating {self.rating}"


class ReferralClick(models.Model):
    """Records each unique click on a referral link for accurate analytics."""
    referral_code = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Referral Click"
        verbose_name_plural = "Referral Clicks"
        # Prevent double-counting: same IP + same code within a session counts once
        indexes = [
            models.Index(fields=['referral_code', 'ip_address']),
        ]

    def __str__(self):
        return f"Click on {self.referral_code} from {self.ip_address} at {self.clicked_at}"


class StoreSettings(models.Model):
    """Singleton model — only one record (pk=1) should ever exist.
    Stores all admin-editable storefront content as structured JSON fields."""

    # Ticker / Promo Banner
    ticker_text = models.TextField(
        default='Limited Offer: Get 20% off all tech products using coupon code COLLABO20'
    )
    ticker_coupon_highlight = models.CharField(max_length=50, default='COLLABO20')

    # Hero Section
    hero_badge_text = models.CharField(max_length=100, default='✨ YOUR ALL-IN-ONE MARKETPLACE')
    hero_headline = models.CharField(max_length=200, default='Premium Tech, Fashion & Daily Essentials')
    hero_subheadline = models.TextField(
        default='Explore high-quality electronics, trendsetting apparel, and essential home goods handpicked for your lifestyle. High quality, great deals.'
    )
    hero_cta_primary = models.CharField(max_length=60, default='Browse Catalog')
    hero_cta_secondary = models.CharField(max_length=60, default='Product Spotlight')

    # Category Card Overrides (image URLs per category slug)
    category_images = models.JSONField(
        default=dict,
        blank=True,
        help_text='Map of category name to background image URL. e.g. {"Electronics": "https://..."}'
    )

    # Featured product IDs for homepage sections
    deals_product_ids = models.JSONField(
        default=list,
        blank=True,
        help_text='List of product IDs to show in Deals of the Day (up to 4)'
    )
    trending_product_ids = models.JSONField(
        default=list,
        blank=True,
        help_text='List of product IDs to show in Trending section (up to 4)'
    )

    # Trending Phones Section
    trending_phones_title = models.CharField(max_length=100, default='Trending Phones')
    trending_phones_subtitle = models.CharField(max_length=100, default='MOBILES')
    trending_phones_product_ids = models.JSONField(
        default=list,
        blank=True,
        help_text='List of product IDs to feature in Trending Phones. Leave empty to auto-show all Mobiles.'
    )

    # Coupon Codes (dynamic)
    coupon_codes = models.JSONField(
        default=list,
        blank=True,
        help_text='List of {code, discount_percent, description} objects'
    )

    # Testimonials
    testimonials = models.JSONField(
        default=list,
        blank=True,
        help_text='List of {name, title, rating, text} testimonial objects'
    )

    # Footer
    footer_tagline = models.TextField(
        default='Designed for visual excellence and premium utility. Inspired by modern SaaS platforms.'
    )
    copyright_text = models.CharField(max_length=200, default='© 2026 Collabo Marketplace Inc. All rights reserved.')

    # Hero Bento Card (right-side dark card — "Top Rated")
    hero_card_carousel_enabled = models.BooleanField(
        default=False,
        help_text='Enable auto-sliding carousel on the hero bento card'
    )
    hero_card_slides = models.JSONField(
        default=list,
        blank=True,
        help_text='List of {title, subtitle, label, rating, image} slide objects for the hero card'
    )

    # Trusted Partners Banner
    trusted_partners = models.JSONField(
        default=list,
        blank=True,
        help_text='List of partner/brand names shown in the scrolling marquee banner'
    )
    trusted_partners_title = models.CharField(max_length=100, default='Allied Global Brands')

    # Promo Cards (sidebar ad carousel in Shop By Category)
    promo_cards = models.JSONField(
        default=list,
        blank=True,
        help_text='List of {badge, title, subtitle, cta, category, bg} promo card objects for the category section sidebar'
    )

    # Shipping
    shipping_charge = models.PositiveIntegerField(default=99, help_text="Flat shipping fee in INR charged per order")
    free_shipping_threshold = models.PositiveIntegerField(default=500, help_text="Order subtotal (INR) above which shipping is free")
    serviceable_pincodes = models.JSONField(default=list, blank=True, help_text="List of deliverable PIN codes. Empty = deliver everywhere.")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Store Settings'
        verbose_name_plural = 'Store Settings'

    def __str__(self):
        return 'Store Settings (Singleton)'

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings record with defaults."""
        obj, _ = cls.objects.get_or_create(pk=1)
        # Populate default coupon codes if empty
        if not obj.coupon_codes:
            obj.coupon_codes = [
                {'code': 'COLLABO20', 'discount_percent': 20, 'description': '20% off on all tech products'},
                {'code': 'FIRSTBUY', 'discount_percent': 10, 'description': '10% off for first-time buyers'},
            ]
            obj.save()
        # Populate default testimonials if empty
        if not obj.testimonials:
            obj.testimonials = [
                {'name': 'Kunal Verma', 'title': 'Verified Buyer', 'rating': 5, 'text': 'Absolutely flawless delivery! The Aero X1 Pro smartphone is an absolute beast. Battery lasts two full days of heavy usage.'},
                {'name': 'Megha Sen', 'title': 'Verified Buyer', 'rating': 5, 'text': 'The organic matcha powder ceremony grade is incredibly rich. Exactly like the high-grade matcha I drank in Kyoto.'},
                {'name': 'Advait Rao', 'title': 'Verified Buyer', 'rating': 4, 'text': 'Elysian office chair provides amazing back support. Setup was easy. Soft mesh is extremely breathable during summer.'},
            ]
            obj.save()
        # Populate default trusted partners if empty
        if not obj.trusted_partners:
            obj.trusted_partners = ['NovaSound', 'GhostKey', 'AeroCorp', 'Vanguard', 'KyotoOrganics', 'AeroPure', 'Elysian', 'StealthGym']
            obj.save()
        # Ensure at least 5 demo testimonials exist
        if len(obj.testimonials) < 5:
            obj.testimonials = [
                {'name': 'Kunal Verma', 'title': 'Verified Buyer', 'rating': 5, 'text': 'Absolutely flawless delivery! The Aero X1 Pro smartphone is an absolute beast. Battery lasts two full days of heavy usage.'},
                {'name': 'Megha Sen', 'title': 'Verified Buyer', 'rating': 5, 'text': 'The organic matcha powder ceremony grade is incredibly rich. Exactly like the high-grade matcha I drank in Kyoto.'},
                {'name': 'Advait Rao', 'title': 'Verified Buyer', 'rating': 4, 'text': 'Elysian office chair provides amazing back support. Setup was easy. Soft mesh is extremely breathable during summer.'},
                {'name': 'Priya Sharma', 'title': 'Verified Buyer', 'rating': 5, 'text': 'Ordered the NovaPro ANC Wireless and the noise cancellation is absolutely incredible. Best headphones I have ever owned!'},
                {'name': 'Rohan Mehta', 'title': 'Verified Buyer', 'rating': 5, 'text': 'The StealthPro keyboard is a game changer. Tactile feedback is perfect and the RGB lighting looks stunning on my desk setup.'},
            ]
            obj.save()
        return obj



class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class ProductInfluencerMedia(models.Model):
    MEDIA_TYPES = [('image', 'Image'), ('video', 'Video')]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='influencer_media')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    file = models.FileField(upload_to='product_influencer_media/')
    title = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.media_type} ({self.id})"


class SellerReview(models.Model):
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_reviews_given')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_reviews_received')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='seller_reviews')
    rating = models.PositiveIntegerField(default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'seller', 'order')
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.buyer.username} for {self.seller.username} - {self.rating}/5"


class SellerPayout(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller_payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    bank_reference = models.CharField(max_length=200, blank=True)
    admin_note = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Payout #{self.id}: {self.seller.username} - INR {self.amount} ({self.status})"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.email