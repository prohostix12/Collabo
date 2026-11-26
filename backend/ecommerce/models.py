from django.db import models
from django.utils import timezone
from accounts.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='📦')
    order = models.PositiveIntegerField(default=0, help_text="Display order on the storefront; lower shows first")
    attribute_schema = models.JSONField(
        default=list, blank=True,
        help_text="Attribute names sellers should fill in for products in this category, e.g. ['Material', 'Size'] — keeps specs consistent for filtering.",
    )

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'id']

    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Vendor(models.Model):
    name = models.CharField(max_length=255)
    return_policy = models.TextField(blank=True, default='')
    delivery_time = models.CharField(max_length=255, default='Free delivery by Tomorrow')
    delivery_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def __str__(self):
        return self.name

class Product(models.Model):
    APPROVAL_STATUS = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    # Defaults to 'approved' so existing products and admin-added listings stay
    # live as-is; seller-submitted products are explicitly set to 'pending' in
    # ProductViewSet.perform_create and only appear to buyers once an admin
    # approves them.
    status = models.CharField(max_length=20, choices=APPROVAL_STATUS, default='approved')
    rejection_reason = models.TextField(blank=True, default='')
    is_active = models.BooleanField(
        default=True,
        help_text="Seller-controlled visibility toggle. Deactivating hides the listing from buyers without touching stock or order history (unlike deleting).",
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True, default='')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    return_policy = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount_percent = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    reviews_count = models.PositiveIntegerField(default=0)
    image = models.TextField(blank=True, help_text="Main product image URL or base64 data")
    images = models.JSONField(default=list, blank=True, help_text="List of extra image URLs or base64 data")
    colors = models.JSONField(default=list, blank=True, help_text="List of color variants [{name: '', image: ''}]")
    description = models.TextField()
    stock = models.PositiveIntegerField(default=0)
    delivery = models.CharField(max_length=255, default='Free delivery by Tomorrow')
    specifications = models.JSONField(default=list, blank=True, help_text="List of specifications [{name: '', value: ''}]")
    attributes = models.JSONField(
        default=dict, blank=True,
        help_text="Structured key:value attributes (e.g. {'Material': 'Cotton', 'Size': 'M'}) used for consistent, filterable specs — distinct from the free-text `specifications` list.",
    )
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

    @property
    def has_variants(self):
        # Uses .all() rather than .exists() so a prefetch_related('variants') on the
        # queryset (e.g. ProductViewSet) is reused instead of issuing a fresh query
        # per product — exists() always hits the DB, ignoring the prefetch cache.
        return bool(self.variants.all())

    def sync_variant_aggregates(self):
        """Keeps the product's own price/stock as a display-level aggregate of its
        active variants, so existing code that reads Product.price/Product.stock
        directly (low-stock widgets, listing cards, etc.) keeps behaving sensibly
        without needing to be made variant-aware everywhere. The variant rows
        themselves — not this aggregate — are what checkout actually debits."""
        active = self.variants.filter(is_active=True)
        total_stock = active.aggregate(s=models.Sum('stock'))['s']
        if total_stock is None:
            return  # no active variants — leave the product's own price/stock as-is
        self.stock = total_stock
        # Representative variant for the product-level (listing-card) price: the
        # cheapest selling price among active variants. Its own regular_price (if
        # any) becomes the product's "MRP" so a discounted variant still shows a
        # real strikethrough/discount% on cards, instead of always forcing 0%.
        cheapest = active.order_by('price').first()
        if cheapest is not None:
            self.price = cheapest.regular_price or cheapest.price
            self.discount_price = cheapest.price
            self.discount_percent = cheapest.discount_percent
        Product.objects.filter(pk=self.pk).update(
            stock=self.stock, price=self.price,
            discount_price=self.discount_price, discount_percent=self.discount_percent,
        )


def _generate_variant_sku(product, attributes):
    """Human-readable auto-SKU: PRODUCTPREFIX-ATTR1-ATTR2-### — e.g. a 'Men's
    T-Shirt' in Black/M becomes MTSH-BLK-M-001. Uniqueness is scoped to the
    seller (two sellers can both land on the same-looking SKU; that's fine,
    the DB constraint is unique_together('seller', 'sku'))."""
    words = [w for w in product.name.upper().split() if w.isalnum()][:2]
    prefix = ''.join(w[:2] for w in words) or 'PRD'
    attr_part = '-'.join(str(v).strip()[:3].upper() for v in attributes.values() if str(v).strip())
    base = f"{prefix}-{attr_part}" if attr_part else prefix
    n = 1
    while ProductVariant.objects.filter(seller=product.seller, sku=f"{base}-{n:03d}").exists():
        n += 1
    return f"{base}-{n:03d}"


class ProductVariant(models.Model):
    """The actual purchasable item in this marketplace. A Product with variants
    is just the shared display shell (name, description, images, category) —
    price, stock and SKU all live here, scoped to the owning seller. Two
    sellers never share a ProductVariant (they don't even share a Product row,
    since Product.seller is already 1:1 with its listing), so one seller's
    stock change can never touch another seller's inventory."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_variants')
    sku = models.CharField(max_length=64, blank=True)
    attributes = models.JSONField(default=dict, help_text="e.g. {'size': 'M', 'color': 'Black'}")
    # Canonical, order-independent string form of `attributes` (e.g. "color:Black|size:M"),
    # recomputed on every save. A DB-level safety net against duplicate attribute
    # combinations for the same product, on top of the application-level check in
    # the serializer — covers the race-condition case two simultaneous saves can't
    # catch via a Python-side query alone.
    attributes_key = models.CharField(max_length=300, editable=False, default='')
    # `price` is, and has always been, the SELLING price (what checkout actually
    # charges) — kept as-is so every existing read/write site (checkout, bulk
    # price updates, order snapshots, serializers) needs zero changes. `regular_price`
    # is the new MRP field; nullable because existing rows get it backfilled equal
    # to `price` in a data migration (so pre-existing variants show 0% discount,
    # never a fabricated one), and new variants may reasonably skip it too (no MRP
    # concept = no discount shown, same as a Product with no discount_price set).
    regular_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="MRP / regular price. Leave blank for no strikethrough price. Must be >= price (selling price).",
    )
    price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Selling price — what checkout actually charges.")
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, help_text="Deactivated variants are hidden from buyers but keep their SKU and order history")
    image = models.TextField(blank=True, default='', help_text="Variant-specific image URL or base64 data; falls back to the product's main image if blank. Kept as the primary/cover image even when extra gallery images exist in VariantImage.")
    hex_code = models.CharField(
        max_length=7, blank=True, default='',
        help_text="Optional '#rrggbb' swatch colour for this variant (only meaningful when attributes includes a colour-like key). Purely cosmetic — never used for matching/uniqueness.",
    )
    low_stock_threshold = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('seller', 'sku'), ('product', 'attributes_key')]
        ordering = ['id']

    @property
    def is_in_stock(self):
        return self.is_active and self.stock > 0

    @property
    def is_low_stock(self):
        return self.is_active and 0 < self.stock <= self.low_stock_threshold

    @property
    def display_image(self):
        return self.image or self.product.image

    @property
    def discount_percent(self):
        """Computed, not stored — mirrors Product.save()'s own rounding so the
        two look consistent wherever both appear side by side."""
        if not self.regular_price or self.regular_price <= 0 or self.regular_price <= self.price:
            return 0
        return int(round((1 - (self.price / self.regular_price)) * 100))

    def save(self, *args, **kwargs):
        if not self.seller_id:
            self.seller = self.product.seller
        # Canonicalize attributes to a sorted "key:value|key:value" string so
        # {"size":"M","color":"Black"} and {"color":"Black","size":"M"} are
        # recognised as the same combination.
        self.attributes_key = '|'.join(f"{k}:{v}" for k, v in sorted((self.attributes or {}).items()))
        if not self.sku:
            self.sku = _generate_variant_sku(self.product, self.attributes or {})
        super().save(*args, **kwargs)
        self.product.sync_variant_aggregates()

    def delete(self, *args, **kwargs):
        product = self.product
        super().delete(*args, **kwargs)
        product.sync_variant_aggregates()

    def __str__(self):
        attrs = ', '.join(f"{k}: {v}" for k, v in (self.attributes or {}).items())
        return f"{self.product.name} ({attrs}) - {self.sku}"


class VariantImage(models.Model):
    """Extra gallery images for a variant, beyond its single cover `image` field —
    e.g. a colour variant that needs 4-5 product shots, not just one."""
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.TextField(help_text="Image URL or base64 data")
    order = models.PositiveIntegerField(default=0, help_text="Display order; lower shows first")

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Image for {self.variant.sku} (#{self.order})"


class VariantChangeLog(models.Model):
    """Audit trail for seller edits to a variant's price/stock/active-status/
    attributes — separate from InventoryMovement (which only covers stock deltas).
    Changes go live immediately (no admin approval gate); this exists purely so
    admins can review what changed, by whom, and when."""
    # SET_NULL (not CASCADE) so a "deleted" log entry survives the variant it
    # describes actually being deleted — product/sku are duplicated into `changes`
    # at write time so the log stays readable once variant is null.
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name='change_logs')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='variant_changes')
    action = models.CharField(max_length=20, choices=(
        ('created', 'Created'), ('updated', 'Updated'), ('deleted', 'Deleted'),
        ('image_added', 'Image Added'), ('image_removed', 'Image Removed'),
    ))
    changes = models.JSONField(default=dict, blank=True, help_text="{field: {'old': ..., 'new': ...}} for changed fields only")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} on {self.variant_id} by {self.actor}"


class InventoryMovement(models.Model):
    """Audit trail for every stock change, variant or legacy non-variant product
    alike, so sellers/admins can see what changed, why, and who/what did it."""
    REASON_CHOICES = (
        ('order_placed', 'Order Placed'),
        ('order_cancelled', 'Order Cancelled / Returned / Refunded'),
        ('manual_adjustment', 'Manual Adjustment'),
        ('bulk_update', 'Bulk Update'),
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_movements')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements')
    change = models.IntegerField(help_text="Positive = stock increased, negative = decreased")
    resulting_stock = models.PositiveIntegerField()
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    note = models.CharField(max_length=255, blank=True, default='')
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_movements')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_actions', help_text="Who made this change; blank for system/order-driven changes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name}: {'+' if self.change >= 0 else ''}{self.change} ({self.reason})"


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    abandoned_reminder_sent_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the last 'you left something in your cart' WhatsApp reminder was sent for the cart's current contents. Reset (implicitly superseded) whenever updated_at moves past it, i.e. the cart changes again."
    )

    def __str__(self):
        return f"Cart: {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    # Required if the product has variants, left null for legacy non-variant
    # products. CASCADE is fine here (unlike OrderItem) — a cart is not a
    # historical record, so if a variant is deleted the cart line just goes with it.
    variant = models.ForeignKey('ProductVariant', on_delete=models.CASCADE, null=True, blank=True, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        # Without this, cart.items.all() has no guaranteed order, so a quantity
        # update (which rewrites the row) can make items visibly reshuffle.
        ordering = ['id']
        unique_together = ('cart', 'product', 'variant')

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
    # Razorpay references, so a payment can be matched to its order (webhooks, refunds,
    # support) and one payment can never create two orders.
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_id} - {self.user.username}"

# Signal handling for WhatsApp notifications
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver


@receiver(pre_save, sender=Order)
def order_pre_save(sender, instance, **kwargs):
    """Capture previous status so post_save can detect transitions."""
    if instance.pk:
        try:
            instance._old_status, instance._old_payment_status = Order.objects.values_list('status', 'payment_status').get(pk=instance.pk)
        except Order.DoesNotExist:
            instance._old_status = None
            instance._old_payment_status = None
    else:
        instance._old_status = None
        instance._old_payment_status = None


@receiver(post_save, sender=Order)
def order_post_save(sender, instance, created, **kwargs):
    """Send WhatsApp notification on order creation and status transitions (fires exactly once per event)."""
    old = getattr(instance, '_old_status', None)
    try:
        from .gupshup import notify_order_placed, notify_order_delivered, notify_order_shipped
        if created:
            # The order's items are saved just AFTER the order row, so wait for the
            # transaction to commit, otherwise the message lists "your items" instead
            # of the real products.
            def _notify_placed():
                try:
                    notify_order_placed(instance)
                except Exception:
                    pass
            from django.db import transaction as _tx
            _tx.on_commit(_notify_placed)
        elif instance.status == 'shipped' and old != 'shipped':
            notify_order_shipped(instance)
        elif instance.status == 'delivered' and old != 'delivered':
            notify_order_delivered(instance)
    except Exception:
        pass

    # Email the customer (order confirmation, payment, shipping, delivery, cancel, return, refund)
    try:
        from . import order_emails
        old_pay = getattr(instance, '_old_payment_status', None)
        if created:
            order_emails.order_placed(instance)
        else:
            status_mail = {
                'shipped': order_emails.order_shipped,
                'delivered': order_emails.order_delivered,
                'cancelled': order_emails.order_cancelled,
                'return_requested': order_emails.return_requested,
                'returned': order_emails.order_returned,
                'refunded': order_emails.order_refunded,
                'return_rejected': order_emails.return_rejected,
            }
            if instance.status != old and instance.status in status_mail:
                status_mail[instance.status](instance)
            elif instance.payment_status != old_pay and instance.status == old:
                if instance.payment_status == 'completed':
                    order_emails.payment_received(instance)
                elif instance.payment_status == 'failed':
                    order_emails.payment_failed(instance)
    except Exception:
        import logging
        logging.getLogger(__name__).exception('Order email failed for %s', getattr(instance, 'order_id', '?'))


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    # SET_NULL (not CASCADE): a variant can be edited or deleted later without
    # touching this row's SKU/attributes/price snapshot below — those are what
    # the invoice and order history actually display, independent of whatever
    # the live variant looks like now.
    variant = models.ForeignKey('ProductVariant', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    # Purchase-time snapshot, copied from the variant (if any) when the order
    # item is created. Survives the variant being edited/deactivated/deleted —
    # "historical orders must not change" per the variant feature's requirements.
    variant_sku = models.CharField(max_length=64, blank=True, default='')
    variant_attributes = models.JSONField(default=dict, blank=True)
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
    level = models.PositiveSmallIntegerField(default=1, help_text="1=direct referrer, 2=upline (their recruiter)")
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


class CustomerReferralLink(models.Model):
    """A per-user, per-product referral link that ANY logged-in user (not just influencers)
    can generate. Purchases made through it credit the referring user's wallet with the
    product's admin-set link_discount_percent, and half of that to whoever referred them."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_links')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='customer_referral_links')
    referral_code = models.CharField(max_length=100, unique=True, blank=True)
    referred_via = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='downline_referral_links',
        help_text="Whoever's referral link (influencer or customer) this user came through for THIS product — "
                  "the upline that earns half the wallet reward when this link converts. Captured at link "
                  "creation time from the active referral code, independent of the account-level referred_by."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import uuid
            self.referral_code = f"cref-{self.user.id}-{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Referral link by {self.user.username} for {self.product.name}"


class WalletTransaction(models.Model):
    """Ledger entry for the customer-referral wallet. Balance is computed on the fly
    (sum of completed credits) rather than cached, matching the SellerPayout/SellerEarnings
    pattern used elsewhere in this app."""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallet_transactions')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name='wallet_transactions')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    level = models.PositiveSmallIntegerField(default=1, help_text="1=direct referrer, 2=upline (their recruiter)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.CharField(max_length=255, blank=True, default='Referral reward')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Wallet tx: {self.user.username} +₹{self.amount} ({self.status})"


class WalletPayout(models.Model):
    """A real cash-withdrawal request against the referral wallet — mirrors SellerPayout,
    plus the bank account the user wants paid out to (collected at request time so the
    admin has what they need to actually send the money).
    Requested by the user any time (not tied to checkout), reviewed and marked
    completed/rejected by an admin. 'pending'/'processing'/'completed' all count as
    already-claimed money for balance purposes; 'rejected' frees it back up."""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallet_payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Bank details submitted by the user for THIS withdrawal request
    # (blank=True/default='' so this migration doesn't break pre-existing payout rows;
    # required at the API level — see wallet_withdraw — for all new requests)
    account_holder_name = models.CharField(max_length=200, blank=True, default='')
    account_number = models.CharField(max_length=30, blank=True, default='')
    ifsc_code = models.CharField(max_length=15, blank=True, default='')

    bank_reference = models.CharField(max_length=200, blank=True, help_text="Admin-entered transaction/UTR reference once paid")
    admin_note = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Wallet Payout #{self.id}: {self.user.username} - INR {self.amount} ({self.status})"


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
    show_deals_section = models.BooleanField(
        default=True,
        help_text='Show/hide the "Deals of the Day" section on the storefront homepage'
    )
    deals_timer_hours = models.PositiveIntegerField(
        default=4,
        help_text='Duration in hours for the "Deals of the Day" countdown timer (recurring)'
    )
    deals_cycle_anchor = models.DateTimeField(
        default=timezone.now,
        help_text='Reference start time the recurring deals countdown cycles are calculated from. '
                   'Reset to now whenever deals_timer_hours changes so the new duration takes effect immediately.'
    )
    deals_product_ids = models.JSONField(
        default=list,
        blank=True,
        help_text='List of product IDs to show in Deals of the Day (up to 4)'
    )
    show_weekly_deals_section = models.BooleanField(
        default=True,
        help_text='Show/hide the "Weekly Best Deals" section on the storefront homepage'
    )
    weekly_deals_timer_hours = models.PositiveIntegerField(
        default=168,
        help_text='Duration in hours for the "Weekly Best Deals" countdown timer (recurring)'
    )
    weekly_deals_cycle_anchor = models.DateTimeField(
        default=timezone.now,
        help_text='Reference start time the recurring Weekly Best Deals countdown cycles are calculated from. '
                   'Reset to now whenever weekly_deals_timer_hours changes so the new duration takes effect immediately.'
    )
    weekly_deals_product_ids = models.JSONField(
        default=list,
        blank=True,
        help_text='List of product IDs to show in Weekly Best Deals (up to 10)'
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

    # Seller Hub (Sell-on-Collabo landing page) hero banner
    seller_hub_banner_image = models.TextField(
        blank=True, default='',
        help_text="Seller Hub hero banner image URL or base64 data. Shown as the big image card in the Sell-on-Collabo hero section."
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


@receiver(pre_save, sender=WalletPayout)
def wallet_payout_pre_save(sender, instance, **kwargs):
    instance._old_status = WalletPayout.objects.filter(pk=instance.pk).values_list('status', flat=True).first() if instance.pk else None


@receiver(post_save, sender=WalletPayout)
def wallet_payout_post_save(sender, instance, created, **kwargs):
    """Email the user when a withdrawal is requested, paid or declined."""
    try:
        from . import order_emails
        old = getattr(instance, '_old_status', None)
        if created:
            order_emails.payout_requested(instance)
        elif instance.status != old and instance.status == 'completed':
            order_emails.payout_completed(instance)
        elif instance.status != old and instance.status == 'rejected':
            order_emails.payout_rejected(instance)
    except Exception:
        import logging
        logging.getLogger(__name__).exception('Wallet payout email failed')
