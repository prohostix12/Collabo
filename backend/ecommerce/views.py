import random
import string
import json
import os
import io
import csv
import re
import hmac
import hashlib
import razorpay
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.db import models as db_models
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status, filters, views, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Product, Cart, CartItem, Address, Order, OrderItem, Category, Brand, ProductReview, AffiliateCommission, StoreSettings, CustomerReview, ReferralClick, ProductInfluencerMedia, Wishlist
from .serializers import (
    ProductSerializer, CartSerializer, CartItemSerializer,
    AddressSerializer, OrderSerializer, OrderItemSerializer,
    CategorySerializer, BrandSerializer, ProductReviewSerializer, StoreSettingsSerializer, CustomerReviewSerializer,
    ProductInfluencerMediaSerializer, WishlistSerializer
)

DEFAULT_CATEGORIES = [
    { 'name': 'Electronics', 'icon': '💻' },
    { 'name': 'Mobiles', 'icon': '📱' },
    { 'name': 'Fashion', 'icon': '👗' },
    { 'name': 'Grocery', 'icon': '🍏' },
    { 'name': 'Home & Kitchen', 'icon': '🍳' },
    { 'name': 'Beauty', 'icon': '💄' },
    { 'name': 'Furniture', 'icon': '🪑' },
    { 'name': 'Sports', 'icon': '⚽' },
    { 'name': 'Books', 'icon': '📚' },
    { 'name': 'Toys', 'icon': '🧸' },
    { 'name': 'Appliances', 'icon': '🔌' }
]

DEFAULT_BRANDS = [
    'NovaSound', 'GhostKey', 'AeroCorp', 'Vanguard', 'KyotoOrganics', 
    'AeroPure', 'CelestialSkin', 'Elysian', 'StealthGym', 'DeepMind Press', 
    'RoboArcade', 'ThermaWave'
]

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'platform_settings.json')

def get_platform_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {'global_commission_rate': 10}

def save_platform_settings(settings_dict):
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings_dict, f)
    except Exception:
        pass

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.user_type == 'admin')

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class IsSellerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.user_type == 'admin':
            return True
        if user.user_type == 'seller':
            profile = getattr(user, 'seller_profile', None)
            return profile is not None and profile.verification_status == 'approved'
        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user or request.user.is_staff or request.user.user_type == 'admin'

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('seller').all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'description', 'category']
    ordering_fields = ['price', 'rating', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSellerOrReadOnly()]

    def get_queryset(self):
        queryset = Product.objects.select_related('seller').all()
        category = self.request.query_params.get('category', None)
        brand = self.request.query_params.get('brand', None)
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        min_rating = self.request.query_params.get('min_rating', None)
        in_stock = self.request.query_params.get('in_stock', None)
        seller_id = self.request.query_params.get('seller', None)

        if category and category != 'All':
            queryset = queryset.filter(category=category)
        if brand:
            queryset = queryset.filter(brand=brand)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        if in_stock == 'true':
            queryset = queryset.filter(stock__gt=0)
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=400)

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            import traceback
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=400)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('product').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product')
        if not product_id:
            return Response({'error': 'Product ID required'}, status=status.HTTP_400_BAD_REQUEST)
        wishlist_item, created = Wishlist.objects.get_or_create(user=request.user, product_id=product_id)
        if not created:
            wishlist_item.delete()
            return Response({'status': 'removed', 'product_id': product_id})
        serializer = self.get_serializer(wishlist_item)
        return Response({'status': 'added', 'item': serializer.data}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def ids(self, request):
        ids = list(Wishlist.objects.filter(user=request.user).values_list('product_id', flat=True))
        return Response(ids)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create_cart(self, user):
        cart, created = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        cart = self._get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add')
    def add_item(self, request):
        cart = self._get_or_create_cart(request.user)
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id)
        
        # Check stock
        if product.stock < quantity:
            return Response({'error': f'Only {product.stock} items left in stock'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
            
        if product.stock < cart_item.quantity:
             return Response({'error': f'Only {product.stock} items left in stock'}, status=status.HTTP_400_BAD_REQUEST)
             
        cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch', 'delete'], url_path='items/(?P<item_id>[^/.]+)')
    def manage_item(self, request, item_id=None):
        cart = self._get_or_create_cart(request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        if request.method == 'DELETE':
            cart_item.delete()
        elif request.method == 'PATCH':
            quantity = request.data.get('quantity')
            if quantity is not None:
                quantity = int(quantity)
                if quantity <= 0:
                    cart_item.delete()
                else:
                    if cart_item.product.stock < quantity:
                        return Response({'error': f'Only {cart_item.product.stock} items in stock'}, status=status.HTTP_400_BAD_REQUEST)
                    cart_item.quantity = quantity
                    cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='clear')
    def clear_cart(self, request):
        cart = self._get_or_create_cart(request.user)
        cart.items.all().delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role', None)
        
        # If admin role
        if user.is_staff or user.user_type == 'admin':
            return Order.objects.all().order_by('-created_at')
            
        # If requesting as a seller, return orders that contain the seller's products
        if role == 'seller':
            return Order.objects.filter(items__product__seller=user).distinct().order_by('-created_at')
            
        # Otherwise return customer's own orders
        return Order.objects.filter(user=user).order_by('-created_at')

    @transaction.atomic
    def create(self, request):
        user = request.user
        address_id = request.data.get('address')
        coupon_code = request.data.get('coupon_code', '')
        payment_method = request.data.get('payment_method', 'upi')
        # Accept a per-product referral map: { "product_id": "referral_code", ... }
        referral_map_raw = request.data.get('referral_map', {})
        # Normalize keys to strings for consistency
        referral_map = {str(k): str(v) for k, v in referral_map_raw.items()} if isinstance(referral_map_raw, dict) else {}
        # Backward compat: single referral_code still accepted (applied to any matching product in cart)
        single_referral_code = request.data.get('referral_code', None)

        if not address_id:
            return Response({'error': 'Shipping address is required'}, status=status.HTTP_400_BAD_REQUEST)

        address = get_object_or_404(Address, id=address_id, user=user)
        
        # Get cart
        cart, _ = Cart.objects.get_or_create(user=user)
        cart_items = cart.items.all()
        selected_items = request.data.get('selected_items')
        if selected_items and isinstance(selected_items, list):
            cart_items = cart_items.filter(id__in=selected_items)
            
        if not cart_items.exists():
            return Response({'error': 'No items selected or cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate pricing with per-product referral discounts
        subtotal = 0
        referral_discount = 0
        valid_referral_map = {}  # only include codes that are verified valid

        from ecommerce.models import ProductReview

        for item in cart_items:
            # Check stock
            if item.product.stock < item.quantity:
                return Response({'error': f'Product {item.product.name} is out of stock or insufficient quantity'}, status=status.HTTP_400_BAD_REQUEST)

            item_subtotal = item.product.discount_price * item.quantity
            subtotal += item_subtotal

            # Look for referral code for this specific product
            product_id_str = str(item.product.id)
            ref_code_for_item = referral_map.get(product_id_str)

            # Fallback: if no map entry, check single legacy referral_code
            if not ref_code_for_item and single_referral_code:
                ref_code_for_item = single_referral_code

            if ref_code_for_item:
                # Verify the referral code belongs to this exact product
                review = ProductReview.objects.filter(referral_code=ref_code_for_item, product=item.product).first()
                if review:
                    # If influencer set a custom price, use that as the unit price
                    effective_unit_price = review.custom_price if review.custom_price is not None else item.product.discount_price
                    effective_item_subtotal = effective_unit_price * item.quantity
                    # Adjust subtotal: replace default with custom-price subtotal
                    subtotal = subtotal - item_subtotal + int(effective_item_subtotal)
                    item_subtotal = int(effective_item_subtotal)

                    discount_pct = review.custom_discount_percent if review.custom_discount_percent is not None else item.product.link_discount_percent
                    # Only apply referral % discount if no custom_price is set
                    if review.custom_price is None:
                        item_referral_discount = int(Decimal(str(item_subtotal)) * Decimal(str(discount_pct)) / Decimal('100'))
                        referral_discount += item_referral_discount
                    valid_referral_map[product_id_str] = ref_code_for_item

        # Load admin-configured store settings once
        store = StoreSettings.get_settings()

        # Coupon Discount (applied to full subtotal) — uses admin-managed coupon list
        discount = 0
        if coupon_code:
            code_upper = coupon_code.upper()
            matched = next(
                (c for c in (store.coupon_codes or []) if c.get('code', '').upper() == code_upper),
                None
            )
            if matched:
                discount = int(Decimal(str(subtotal)) * Decimal(str(matched['discount_percent'])) / Decimal('100'))

        discount += referral_discount

        # Delivery Charge — use admin-configured values
        delivery_charge = 0 if subtotal > store.free_shipping_threshold else store.shipping_charge
        final_amount = subtotal - discount + delivery_charge

        # Points Redemption
        redeem_points = request.data.get('redeem_points', False)
        if user.reward_points is None:
            user.reward_points = 0
            
        if redeem_points and user.reward_points >= 100:
            points_redeemed = min(user.reward_points, int(final_amount))
            discount += points_redeemed
            final_amount -= points_redeemed
            user.reward_points -= points_redeemed

        # Calculate reward points earned from this purchase (spend 100rs = 1 point)
        earned_points = int(final_amount // 100)
        user.reward_points += earned_points
        user.save()

        # Unique Order ID
        random_digits = ''.join(random.choices(string.digits, k=7))
        order_id = f"ORD-{random_digits}"

        # Expected delivery date — standard 3–5 business days
        from datetime import date, timedelta
        def add_business_days(start, days):
            current = start
            added = 0
            while added < days:
                current += timedelta(days=1)
                if current.weekday() < 5:  # Mon–Fri
                    added += 1
            return current
        expected_delivery_date = add_business_days(date.today(), 5)

        # Create Order — store valid_referral_map for per-product tracking
        order = Order.objects.create(
            user=user,
            address=address,
            total_amount=subtotal,
            discount_amount=discount,
            delivery_charge=delivery_charge,
            final_amount=final_amount,
            payment_method=payment_method,
            payment_status='completed' if payment_method in ['upi', 'card'] else 'pending',
            expected_delivery_date=expected_delivery_date,
            status='processing',
            order_id=order_id,
            referral_code=single_referral_code,  # backward compat
            referral_map=valid_referral_map
        )

        # Create Order Items, decrease stock, and award commissions
        for item in cart_items:
            # Determine effective unit price (custom_price takes priority if referral used)
            product_id_str = str(item.product.id)
            ref_code_for_item = valid_referral_map.get(product_id_str)
            effective_price = item.product.discount_price
            if ref_code_for_item:
                review_for_price = ProductReview.objects.filter(referral_code=ref_code_for_item, product=item.product).first()
                if review_for_price and review_for_price.custom_price is not None:
                    effective_price = review_for_price.custom_price

            order_item = OrderItem.objects.create(
                order=order,
                product=item.product,
                price=effective_price,
                quantity=item.quantity
            )
            # Decrease stock
            item.product.stock -= item.quantity
            item.product.save()

            # Process referral commission for this product if it has a valid referral
            product_id_str = str(item.product.id)
            ref_code_for_item = valid_referral_map.get(product_id_str)
            if ref_code_for_item:
                review = ProductReview.objects.filter(referral_code=ref_code_for_item, product=item.product).first()
                if review:
                    if review.custom_commission_rate is not None:
                        rate = review.custom_commission_rate
                    else:
                        rate = item.product.commission_rate

                    # Actual amount paid for this item
                    item_total = Decimal(str(order_item.price * order_item.quantity))
                    if review.custom_price is not None:
                        # custom_price already bakes in the price — no extra referral discount
                        item_referral_discount = Decimal('0')
                    else:
                        discount_pct = review.custom_discount_percent if review.custom_discount_percent is not None else item.product.link_discount_percent
                        item_referral_discount = item_total * Decimal(str(discount_pct)) / Decimal('100')
                    # Proportional coupon discount for this item
                    coupon_only = discount - referral_discount
                    if subtotal > 0 and coupon_only > 0:
                        item_coupon_discount = item_total * (Decimal(str(coupon_only)) / Decimal(str(subtotal)))
                    else:
                        item_coupon_discount = Decimal('0')
                    actual_item_amount = item_total - item_referral_discount - item_coupon_discount

                    commission_amount = actual_item_amount * Decimal(str(rate)) / Decimal('100')
                    commission_amount = commission_amount.quantize(Decimal('0.01'))

                    commission_status = 'completed' if order.payment_status == 'completed' else 'pending'
                    AffiliateCommission.objects.create(
                        influencer=review.influencer,
                        order=order,
                        product=item.product,
                        amount=commission_amount,
                        status=commission_status
                    )

        # Clear cart
        cart_items.delete()

        # Fire async notification (WhatsApp + SMS) — non-blocking
        try:
            from .tasks import notify_order_placed_async
            import threading
            threading.Thread(target=lambda: notify_order_placed_async.delay(order.id)).start()
        except Exception:
            pass  # Never block order completion due to notification failure

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['patch'], url_path='status')
    @transaction.atomic
    def update_status(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Choose from: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure requesting user is either seller of a product in the order, or an admin
        user = request.user
        is_order_seller = OrderItem.objects.filter(order=order, product__seller=user).exists()
        is_admin = user.is_staff or user.user_type == 'admin'

        if not (is_order_seller or is_admin):
            return Response({'error': 'You do not have permission to update this order'}, status=status.HTTP_403_FORBIDDEN)

        old_status = order.status
        order.status = new_status

        if new_status == 'shipped' and old_status != 'shipped':
            order.tracking_number = request.data.get('tracking_number', '') or order.tracking_number
            order.shipping_provider = request.data.get('shipping_provider', '') or order.shipping_provider
            order.shipped_at = timezone.now()

        if request.data.get('tracking_number') and new_status in ('shipped', 'delivered'):
            order.tracking_number = request.data['tracking_number']
        if request.data.get('shipping_provider') and new_status in ('shipped', 'delivered'):
            order.shipping_provider = request.data['shipping_provider']

        # Auto update payment status if delivered
        if new_status == 'delivered':
            order.payment_status = 'completed'
            # Finalise any pending affiliate commissions for this order
            AffiliateCommission.objects.filter(order=order, status='pending').update(status='completed')
            
        # Revert stock and commissions if order gets cancelled, returned or refunded
        if new_status in ['cancelled', 'returned', 'refunded'] and old_status not in ['cancelled', 'returned', 'refunded']:
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.save()
            AffiliateCommission.objects.filter(order=order).update(status='cancelled')

            if new_status == 'cancelled' and not order.cancelled_at:
                order.cancelled_at = timezone.now()
                order.cancel_reason = request.data.get('reason', 'Cancelled by Seller/Admin')
            elif new_status == 'returned' and not order.return_requested_at:
                order.return_requested_at = timezone.now()
                order.return_reason = request.data.get('reason', 'Returned by Seller/Admin')
                
        if new_status == 'return_rejected':
            rejection_reason = request.data.get('reason', 'Rejection by seller')
            order.return_comment = f"{order.return_comment or ''}\n[Rejected: {rejection_reason}]".strip()

        order.save()

        # Fire delivery notification when marked as delivered
        if new_status == 'delivered' and old_status != 'delivered':
            try:
                from .tasks import notify_order_delivered_async
                notify_order_delivered_async.delay(order.id)
            except Exception:
                pass

        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='toggle-partner-status')
    def toggle_partner_status(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        user = request.user
        
        # Only admins can toggle this
        if not (user.is_staff or user.user_type == 'admin'):
            return Response({'error': 'Only administrators can update partner status'}, status=status.HTTP_403_FORBIDDEN)
            
        # Toggle the boolean
        order.sent_to_partner = not order.sent_to_partner
        order.save(update_fields=['sent_to_partner'])
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='ship')
    @transaction.atomic
    def ship_order(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        user = request.user
        is_admin = user.is_staff or user.user_type == 'admin'
        is_order_seller = OrderItem.objects.filter(order=order, product__seller=user).exists()
        if not (is_admin or is_order_seller):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if order.status not in ('pending', 'processing'):
            return Response({'error': f'Cannot ship order in {order.status} status'}, status=status.HTTP_400_BAD_REQUEST)

        method = request.data.get('method', 'manual')

        if method == 'shiprocket':
            try:
                from .shiprocket import create_shiprocket_order, generate_awb, schedule_pickup
                sr_result = create_shiprocket_order(order)
                order.shiprocket_order_id = str(sr_result.get('shiprocket_order_id', ''))
                order.shiprocket_shipment_id = str(sr_result.get('shipment_id', ''))

                if order.shiprocket_shipment_id:
                    awb_result = generate_awb(int(order.shiprocket_shipment_id))
                    order.tracking_number = awb_result.get('awb_code', '')
                    order.shipping_provider = awb_result.get('courier_name', 'Shiprocket')
                    try:
                        schedule_pickup(int(order.shiprocket_shipment_id))
                    except Exception:
                        pass

                order.status = 'shipped'
                order.shipped_at = timezone.now()
                order.save()
                return Response(OrderSerializer(order).data)
            except Exception as e:
                return Response({'error': f'Shiprocket: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        tracking = request.data.get('tracking_number', '').strip()
        provider = request.data.get('shipping_provider', '').strip()
        if not tracking:
            return Response({'error': 'Tracking number is required'}, status=status.HTTP_400_BAD_REQUEST)

        order.tracking_number = tracking
        order.shipping_provider = provider or 'Other'
        order.status = 'shipped'
        order.shipped_at = timezone.now()
        order.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['get'], url_path='track')
    def track_order(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        if not (request.user == order.user or request.user.is_staff or request.user.user_type == 'admin'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        if not order.tracking_number:
            return Response({'error': 'No tracking info'}, status=status.HTTP_404_NOT_FOUND)

        result = {
            'tracking_number': order.tracking_number,
            'shipping_provider': order.shipping_provider,
            'shipped_at': order.shipped_at,
            'status': order.status,
        }

        if order.shiprocket_shipment_id and order.tracking_number:
            try:
                from .shiprocket import track_shipment
                sr_tracking = track_shipment(order.tracking_number)
                result['shiprocket_tracking'] = sr_tracking
            except Exception:
                pass

        return Response(result)

    @action(detail=True, methods=['post'], url_path='cancel')
    @transaction.atomic
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        user = request.user
        
        # Check permissions: owner or admin/staff
        if order.user != user and not (user.is_staff or user.user_type == 'admin'):
            return Response({'error': 'You do not have permission to cancel this order'}, status=status.HTTP_403_FORBIDDEN)
            
        # Check current status: pre-dispatch only
        if order.status not in ['pending', 'processing']:
            return Response({'error': f'Order cannot be cancelled. Current status is: {order.status}'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'User Cancelled')
        comment = request.data.get('comment', '').strip()

        if not comment:
            return Response({'error': 'A comment is required when cancelling an order.'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle file attachments
        attachment_urls = []
        import os
        from django.conf import settings as django_settings
        upload_dir = os.path.join(django_settings.MEDIA_ROOT, 'cancel_attachments')
        os.makedirs(upload_dir, exist_ok=True)
        for f in request.FILES.getlist('attachments'):
            safe_name = f"{order.order_id}_{f.name}"
            file_path = os.path.join(upload_dir, safe_name)
            with open(file_path, 'wb+') as dest:
                for chunk in f.chunks():
                    dest.write(chunk)
            attachment_urls.append(f"{django_settings.MEDIA_URL}cancel_attachments/{safe_name}")

        order.status = 'cancelled'
        order.cancel_reason = reason
        order.cancel_comment = comment
        order.cancel_attachments = attachment_urls
        order.cancelled_at = timezone.now()
        order.save()
        
        # Revert stock
        for item in order.items.all():
            item.product.stock += item.quantity
            item.product.save()
            
        # Revert commissions
        AffiliateCommission.objects.filter(order=order).update(status='cancelled')
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='return')
    @transaction.atomic
    def return_order(self, request, pk=None):
        order = self.get_object()
        user = request.user
        
        # Check permissions: owner or admin/staff
        if order.user != user and not (user.is_staff or user.user_type == 'admin'):
            return Response({'error': 'You do not have permission to return this order'}, status=status.HTTP_403_FORBIDDEN)
            
        # Check current status
        if order.status != 'delivered':
            return Response({'error': 'Only delivered orders can be returned'}, status=status.HTTP_400_BAD_REQUEST)

        # Check return window (7 days from delivery date / last update timestamp)
        delivered_date = order.updated_at
        if timezone.now() - delivered_date > timedelta(days=7):
            return Response({'error': 'The 7-day return window has expired for this order'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason')
        if not reason:
            return Response({'error': 'Return reason is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        comment = request.data.get('comment', '')
        
        order.status = 'return_requested'
        order.return_reason = reason
        order.return_comment = comment
        order.return_requested_at = timezone.now()
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)

class CustomerReviewViewSet(viewsets.ModelViewSet):
    queryset = CustomerReview.objects.all()
    serializer_class = CustomerReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        review = self.get_object()
        user = request.user
        is_admin = user.is_staff or user.user_type == 'admin'
        if review.user != user and not is_admin:
            return Response({'error': 'You can only edit your own reviews'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        user = request.user
        is_admin = user.is_staff or user.user_type == 'admin'
        if review.user != user and not is_admin:
            return Response({'error': 'You can only delete your own reviews'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        queryset = CustomerReview.objects.all()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        product_id = self.request.data.get('product')

        is_influencer = user.user_type == 'influencer'
        is_admin = user.is_staff or user.user_type == 'admin'
        has_purchased = OrderItem.objects.filter(
            order__user=user,
            product_id=product_id,
            order__payment_status='completed'
        ).exists()

        if not has_purchased and not is_influencer and not is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only review products you have purchased.")

        if CustomerReview.objects.filter(user=user, product_id=product_id).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You have already reviewed this product.")

        serializer.save(user=user)

        # Award 5 reward points for writing a review
        if user.reward_points is None:
            user.reward_points = 0
        user.reward_points += 5
        user.save(update_fields=['reward_points'])

class ProductReviewViewSet(viewsets.ModelViewSet):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = ProductReview.objects.all()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.user_type != 'influencer':
            raise permissions.exceptions.PermissionDenied("Only influencers can write reviews and generate referral links.")

        custom_price = serializer.validated_data.get('custom_price')
        if custom_price is not None:
            product_id = serializer.validated_data['product'].id
            from .models import Product as ProductModel
            product = ProductModel.objects.get(pk=product_id)
            floor_price = product.discount_price if product.discount_price else product.price
            if custom_price < floor_price:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"custom_price": f"Custom price cannot be lower than the product price (₹{floor_price})."})

        serializer.save(influencer=self.request.user)

    @action(detail=False, methods=['get'], url_path='link-buyers', permission_classes=[permissions.IsAuthenticated])
    def link_buyers(self, request):
        """
        Returns list of buyers for a specific referral code — using AffiliateCommission records
        which are reliably created for every purchase via referral_map, not just legacy referral_code.
        Query param: ?referral_code=<code>
        """
        user = request.user
        ref_code = request.query_params.get('referral_code', '')
        if not ref_code:
            return Response({'error': 'referral_code is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the referral code belongs to this influencer
        review = ProductReview.objects.filter(referral_code=ref_code, influencer=user).first()
        if not review:
            return Response({'error': 'Referral code not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get all commissions for this referral code's product by this influencer
        commissions = AffiliateCommission.objects.filter(
            influencer=user,
            product=review.product
        ).select_related('order__user').order_by('-created_at')

        buyers = []
        for c in commissions:
            buyers.append({
                'username': c.order.user.username,
                'amount': float(c.order.final_amount),
                'commission': float(c.amount),
                'date': c.created_at.strftime('%Y-%m-%d'),
                'order_id': c.order.order_id,
            })

        return Response(buyers)

    @action(detail=False, methods=['get'], url_path='my-referrals', permission_classes=[permissions.IsAuthenticated])
    def my_referrals(self, request):
        user = request.user
        if user.user_type != 'influencer':
            return Response({'error': 'Only influencers have referrals'}, status=status.HTTP_400_BAD_REQUEST)
        
        reviews = ProductReview.objects.filter(influencer=user).select_related('product').order_by('-created_at')
        referral_list = []
        total_clicks = 0
        
        for r in reviews:
            commissions = AffiliateCommission.objects.filter(influencer=user, product=r.product)
            conversions = commissions.count()
            earned_commission = commissions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            # Real click count from the database
            clicks = ReferralClick.objects.filter(referral_code=r.referral_code).count()
            
            referral_link = f"http://localhost:3000/?ref={r.referral_code}&pid={r.product.id}"
            
            referral_list.append({
                'id': r.id,
                'product_id': r.product.id,
                'product_name': r.product.name,
                'product_image': r.product.image,
                'rating': r.rating,
                'comment': r.comment,
                'referral_code': r.referral_code,
                'referral_link': referral_link,
                'clicks': clicks,
                'conversions': conversions,
                'earned_commission': float(earned_commission),
                'custom_discount_percent': r.custom_discount_percent,
                'custom_commission_rate': r.custom_commission_rate,
                'link_discount_percent': r.product.link_discount_percent,
                'created_at': r.created_at
            })
            total_clicks += clicks

        total_commissions_count = AffiliateCommission.objects.filter(influencer=user).count()
        total_commissions_earned = (
            AffiliateCommission.objects.filter(influencer=user)
            .aggregate(total=Sum('amount'))['total'] or Decimal('0')
        )
        
        return Response({
            'referrals': referral_list,
            'summary': {
                'total_referrals': reviews.count(),
                'total_clicks': total_clicks,
                'total_conversions': total_commissions_count,
                'total_earned': float(total_commissions_earned)
            }
        })

class PlatformSettingsView(views.APIView):
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]

    def get(self, request):
        return Response(get_platform_settings())

    def post(self, request):
        data = request.data
        rate = data.get('global_commission_rate')
        if rate is not None:
            try:
                rate = int(rate)
                if rate < 0 or rate > 100:
                    return Response({'error': 'Commission rate must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({'error': 'Invalid commission rate'}, status=status.HTTP_400_BAD_REQUEST)
            
            settings_dict = get_platform_settings()
            settings_dict['global_commission_rate'] = rate
            save_platform_settings(settings_dict)
            return Response(settings_dict)
        return Response({'error': 'global_commission_rate is required'}, status=status.HTTP_400_BAD_REQUEST)

class StoreSettingsView(views.APIView):
    """GET: Public. POST: Admin only. Full CRUD for storefront homepage settings."""

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]

    def get(self, request):
        settings_obj = StoreSettings.get_settings()
        serializer = StoreSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def post(self, request):
        settings_obj = StoreSettings.get_settings()
        serializer = StoreSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([])
def check_pincode(request):
    pincode = request.query_params.get('pincode', '').strip()
    if not pincode or len(pincode) != 6 or not pincode.isdigit():
        return Response({'error': 'Enter a valid 6-digit PIN code'}, status=status.HTTP_400_BAD_REQUEST)
    settings_obj = StoreSettings.get_settings()
    pincodes = settings_obj.serviceable_pincodes or []
    if not pincodes:
        return Response({'available': True, 'message': 'Delivery available'})
    available = pincode in [str(p) for p in pincodes]
    return Response({
        'available': available,
        'message': 'Delivery available to this PIN code' if available else 'Sorry, delivery is not available to this PIN code'
    })


class AdminAffiliatesView(views.APIView):
    """GET: Admin only. View all affiliate links and associated buyers."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        affiliates_data = []
        reviews = ProductReview.objects.select_related('influencer', 'product').all().order_by('-created_at')
        
        for review in reviews:
            ref_code = review.referral_code
            if not ref_code:
                continue
            
            orders = Order.objects.filter(referral_code=ref_code, payment_status='completed').select_related('user').prefetch_related('items__product')
            
            buyers = []
            total_earned = 0
            products_bought = 0
            
            commissions = AffiliateCommission.objects.filter(order__in=orders, influencer=review.influencer)
            for c in commissions:
                total_earned += c.amount

            for o in orders:
                for item in o.items.all():
                    if item.product_id == review.product_id:
                        products_bought += item.quantity
                
                buyers.append({
                    'username': o.user.username,
                    'email': o.user.email,
                    'amount': o.final_amount,
                    'date': o.created_at.strftime("%Y-%m-%d")
                })
            
            # Real click count from the database
            clicks = ReferralClick.objects.filter(referral_code=ref_code).count()

            affiliates_data.append({
                'id': review.id,
                'influencer': review.influencer.username,
                'product_name': review.product.name,
                'product_price': float(review.product.price),
                'product_discount_price': float(review.product.discount_price) if review.product.discount_price else float(review.product.price),
                'custom_price': float(review.custom_price) if review.custom_price is not None else None,
                'commission_rate': review.product.commission_rate,
                'custom_commission_rate': review.custom_commission_rate,
                'custom_discount_percent': review.custom_discount_percent,
                'link_discount_percent': review.product.link_discount_percent,
                'rating': review.rating,
                'referral_code': ref_code,
                'clicks': clicks,
                'conversions': len(orders),
                'products_bought': products_bought,
                'total_earned': total_earned,
                'created_at': review.created_at.strftime("%Y-%m-%d"),
                'buyers': buyers
            })

        return Response(affiliates_data)

class AdminUpdateAffiliateRateView(views.APIView):
    """PUT: Admin only. Update custom discount and commission rates for a referral link."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def put(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        review = get_object_or_404(ProductReview, id=pk)
        
        custom_discount_percent = request.data.get('custom_discount_percent')
        custom_commission_rate = request.data.get('custom_commission_rate')
        
        if custom_discount_percent is not None:
            if custom_discount_percent == "":
                review.custom_discount_percent = None
            else:
                try:
                    val = int(custom_discount_percent)
                    if 0 <= val <= 100:
                        review.custom_discount_percent = val
                    else:
                        return Response({'error': 'Discount percent must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({'error': 'Invalid discount percent'}, status=status.HTTP_400_BAD_REQUEST)
                    
        if custom_commission_rate is not None:
            if custom_commission_rate == "":
                review.custom_commission_rate = None
            else:
                try:
                    val = int(custom_commission_rate)
                    if 0 <= val <= 100:
                        review.custom_commission_rate = val
                    else:
                        return Response({'error': 'Commission rate must be between 0 and 100'}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({'error': 'Invalid commission rate'}, status=status.HTTP_400_BAD_REQUEST)
                    
        review.save()
        return Response({
            'id': review.id,
            'custom_discount_percent': review.custom_discount_percent,
            'custom_commission_rate': review.custom_commission_rate,
            'message': 'Rates updated successfully'
        })



class RecordReferralClickView(views.APIView):
    """POST: Public. Records a click on a referral link.
    Uses IP deduplication — same IP + same code only records one click per visit."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ref_code = request.data.get('referral_code')
        if not ref_code:
            return Response({'error': 'referral_code is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate referral code exists
        if not ProductReview.objects.filter(referral_code=ref_code).exists():
            return Response({'error': 'Invalid referral code'}, status=status.HTTP_404_NOT_FOUND)

        # Get client IP for deduplication
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Remove 24h IP deduplication to allow local testing
        ReferralClick.objects.create(
            referral_code=ref_code,
            ip_address=ip,
            user_agent=user_agent[:500]
        )
        return Response({'recorded': True, 'referral_code': ref_code})


class ResolveReferralView(views.APIView):
    """GET: Public. Resolves a referral code to its product.
    Returns product details so the frontend can auto-navigate and show a discount banner.
    
    Query params: ?ref=REFERRAL_CODE
    Response: { product_id, product_name, product_image, discount_percent: 10 }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ref_code = request.query_params.get('ref')
        if not ref_code:
            return Response({'error': 'ref query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        review = ProductReview.objects.filter(referral_code=ref_code).select_related('product').first()
        if not review:
            return Response({'error': 'Invalid referral code'}, status=status.HTTP_404_NOT_FOUND)

        product = review.product
        return Response({
            'referral_code': ref_code,
            'product_id': product.id,
            'product_name': product.name,
            'product_brand': product.brand,
            'product_image': product.image,
            'product_price': float(product.price),
            'product_discount_price': float(product.discount_price),
            'discount_percent': review.custom_discount_percent if review.custom_discount_percent is not None else product.link_discount_percent,
            'influencer': review.influencer.username,
            'custom_price': float(review.custom_price) if review.custom_price is not None else None,
        })


class AdminAnalyticsView(views.APIView):
    """GET: Admin only. Aggregated real-time analytics for the admin portal."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_staff or getattr(user, 'user_type', None) == 'admin'):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()

        # --- Orders ---
        completed_orders = Order.objects.filter(payment_status='completed')
        total_revenue = completed_orders.aggregate(t=Sum('final_amount'))['t'] or Decimal('0')
        total_orders = completed_orders.count()

        # Monthly breakdown — last 6 months
        monthly_data = []
        for i in range(5, -1, -1):
            month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            qs = completed_orders.filter(created_at__gte=month_start, created_at__lt=month_end)
            rev = qs.aggregate(t=Sum('final_amount'))['t'] or Decimal('0')
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'orders': qs.count(),
                'revenue': float(rev),
            })

        # --- Commissions ---
        total_commissions_paid = AffiliateCommission.objects.filter(status='completed').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')
        total_commissions_pending = AffiliateCommission.objects.filter(status='pending').aggregate(
            t=Sum('amount'))['t'] or Decimal('0')

        # Top influencers by commission earned
        top_influencers_qs = (
            AffiliateCommission.objects
            .filter(status='completed')
            .values('influencer__id', 'influencer__username', 'influencer__first_name', 'influencer__last_name')
            .annotate(total_earned=Sum('amount'), conversions=Count('id'))
            .order_by('-total_earned')[:10]
        )
        top_influencers = [
            {
                'id': row['influencer__id'],
                'username': row['influencer__username'],
                'full_name': f"{row['influencer__first_name']} {row['influencer__last_name']}".strip()
                             or row['influencer__username'],
                'total_earned': float(row['total_earned']),
                'conversions': row['conversions'],
            }
            for row in top_influencers_qs
        ]

        # Also add click count per influencer
        for inf in top_influencers:
            codes = list(ProductReview.objects.filter(
                influencer_id=inf['id']).values_list('referral_code', flat=True))
            inf['total_clicks'] = ReferralClick.objects.filter(referral_code__in=codes).count()

        # --- Products ---
        total_products = Product.objects.count()
        total_stock = Product.objects.aggregate(t=Sum('stock'))['t'] or 0

        # --- Affiliate links ---
        total_affiliate_links = ProductReview.objects.count()
        active_influencers = ProductReview.objects.values('influencer').distinct().count()

        return Response({
            'orders': {
                'total': total_orders,
                'total_revenue': float(total_revenue),
                'monthly': monthly_data,
            },
            'commissions': {
                'total_paid': float(total_commissions_paid),
                'total_pending': float(total_commissions_pending),
                'top_influencers': top_influencers,
            },
            'products': {
                'total': total_products,
                'total_stock': total_stock,
            },
            'affiliates': {
                'total_links': total_affiliate_links,
                'active_influencers': active_influencers,
            },
        })


# ── Razorpay Payment Views ──────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_razorpay_order(request):
    """Create a Razorpay order and return order_id + key_id to frontend."""
    amount = request.data.get('amount')  # amount in rupees
    if not amount:
        return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)

    is_dummy = (
        not settings.RAZORPAY_KEY_ID or 
        not settings.RAZORPAY_KEY_SECRET or 
        'XXXX' in settings.RAZORPAY_KEY_ID or 
        'XXXX' in settings.RAZORPAY_KEY_SECRET
    )

    if is_dummy:
        import uuid
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        return Response({
            'rzp_order_id': mock_order_id,
            'amount': int(float(amount) * 100),
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID,
            'is_mock': True
        })

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        rzp_order = client.order.create({
            'amount': int(float(amount) * 100),  # paise
            'currency': 'INR',
            'payment_capture': 1,
        })
        return Response({
            'rzp_order_id': rzp_order['id'],
            'amount': rzp_order['amount'],
            'currency': rzp_order['currency'],
            'key_id': settings.RAZORPAY_KEY_ID,
        })
    except Exception as e:
        import uuid
        mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        return Response({
            'rzp_order_id': mock_order_id,
            'amount': int(float(amount) * 100),
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID or 'rzp_test_mock',
            'is_mock': True,
            'note': 'Fallback due to: ' + str(e)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_razorpay_payment(request):
    """Verify Razorpay signature, then place the order."""
    rzp_order_id = request.data.get('razorpay_order_id')
    rzp_payment_id = request.data.get('razorpay_payment_id')
    rzp_signature = request.data.get('razorpay_signature')

    is_mock = (
        (rzp_order_id and rzp_order_id.startswith('order_mock_')) or 
        rzp_signature == 'mock_signature' or
        not settings.RAZORPAY_KEY_SECRET or 
        'XXXX' in settings.RAZORPAY_KEY_SECRET
    )

    if not is_mock:
        # Verify signature
        body = f"{rzp_order_id}|{rzp_payment_id}"
        expected = hmac.new(
            bytes(settings.RAZORPAY_KEY_SECRET, 'utf-8'),
            bytes(body, 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if expected != rzp_signature:
            return Response({'error': 'Payment verification failed. Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

    # Signature valid — place the actual order
    address_id = request.data.get('address')
    coupon_code = request.data.get('coupon_code', '')
    referral_code = request.data.get('referral_code', '')
    referral_map = request.data.get('referral_map', {})

    # Delegate to order creation logic (reuse OrderViewSet internals)
    from .models import Cart, CartItem, Address, AffiliateCommission
    user = request.user
    try:
        cart = Cart.objects.get(user=user)
        cart_items = CartItem.objects.filter(cart=cart).select_related('product')
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        address = Address.objects.get(id=address_id, user=user)

        total = sum(item.product.discount_price * item.quantity for item in cart_items)
        delivery = 0 if total >= 500 else 40
        discount = Decimal('0')

        if coupon_code:
            from .models import StoreSettings
            try:
                store = StoreSettings.objects.first()
                coupons = store.coupon_codes if store else []
                found = next((c for c in coupons if c.get('code', '').upper() == coupon_code.upper()), None)
                if found:
                    discount = total * Decimal(found['discount_percent']) / 100
            except Exception:
                pass

        final = total - discount + delivery

        # Points Redemption
        redeem_points = request.data.get('redeem_points', False)
        if user.reward_points is None:
            user.reward_points = 0
            
        if redeem_points and user.reward_points >= 100:
            points_redeemed = min(user.reward_points, int(final))
            discount += points_redeemed
            final -= points_redeemed
            user.reward_points -= points_redeemed

        # Calculate reward points earned from this purchase
        earned_points = int(final // 100)
        user.reward_points += earned_points
        user.save()

        with transaction.atomic():
            order_id = 'ORD-' + ''.join(random.choices(string.digits, k=7))
            order = Order.objects.create(
                user=user,
                address=address,
                total_amount=total,
                discount_amount=discount,
                delivery_charge=delivery,
                final_amount=final,
                payment_method='razorpay',
                payment_status='completed',
                status='processing',
                order_id=order_id,
                referral_code=referral_code,
                referral_map=referral_map,
            )
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.discount_price,
                )
                item.product.stock = max(0, item.product.stock - item.quantity)
                item.product.save()

                # Affiliate commission
                prod_ref = referral_map.get(str(item.product.id)) or referral_code
                if prod_ref:
                    from .models import ProductReview
                    review = ProductReview.objects.filter(referral_code=prod_ref, product=item.product).first()
                    if review:
                        commission_rate = Decimal('0.05')
                        AffiliateCommission.objects.create(
                            influencer=review.influencer,
                            product=item.product,
                            order=order,
                            commission_amount=item.product.discount_price * item.quantity * commission_rate,
                            status='pending',
                        )

            cart_items.delete()

        return Response({'order_id': order.order_id, 'razorpay_payment_id': rzp_payment_id})
    except Address.DoesNotExist:
        return Response({'error': 'Address not found'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def razorpay_webhook(request):
    """Handle Razorpay webhook events for payment.captured and payment.failed."""
    import hmac
    import hashlib
    import json

    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
    payload = request.body
    received_sig = request.headers.get('X-Razorpay-Signature', '')

    if webhook_secret:
        expected_sig = hmac.new(
            webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_sig, received_sig):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        data = json.loads(payload)
        event = data.get('event')
        payment_data = data.get('payload', {}).get('payment', {}).get('entity', {})
        rzp_order_id = payment_data.get('order_id')

        if event == 'payment.captured' and rzp_order_id:
            order = Order.objects.filter(razorpay_order_id=rzp_order_id).first()
            if order and order.status == 'pending':
                order.status = 'confirmed'
                order.payment_status = 'paid'
                order.save()

        elif event == 'payment.failed' and rzp_order_id:
            order = Order.objects.filter(razorpay_order_id=rzp_order_id).first()
            if order and order.status == 'pending':
                order.payment_status = 'failed'
                order.save()

    except Exception as e:
        pass

    return Response({'status': 'ok'})


class BroadcastOfferView(views.APIView):
    """
    POST: Admin only.
    Trigger a WhatsApp + SMS offer broadcast to all users (or a subset).

    Body: { coupon_code, discount_percent, description, user_ids (optional list) }
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def post(self, request):
        if not (request.user.is_staff or request.user.user_type == 'admin'):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        coupon_code  = request.data.get('coupon_code', '')
        discount_pct = request.data.get('discount_percent', 10)
        description  = request.data.get('description', '')
        user_ids     = request.data.get('user_ids', None)

        if not coupon_code:
            return Response({'error': 'coupon_code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .tasks import broadcast_offer
            task = broadcast_offer.delay(
                coupon_code=str(coupon_code).upper(),
                discount_pct=int(discount_pct),
                description=description,
                user_ids=user_ids,
            )
            return Response({
                'message': 'Offer broadcast queued successfully.',
                'task_id': task.id,
                'coupon_code': coupon_code,
                'discount_percent': discount_pct,
            })
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── Influencer Media: admin upload / influencer view ──────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_influencer_media(request, product_id):
    """Admin uploads photo/video for a product. Only influencers can later view it."""
    if not (request.user.is_staff or request.user.user_type == 'admin'):
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    product = get_object_or_404(Product, pk=product_id)
    files = request.FILES.getlist('files') or request.FILES.getlist('file')
    media_type = request.data.get('media_type', 'image')
    title = request.data.get('title', '')

    if not files:
        return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    for f in files:
        obj = ProductInfluencerMedia.objects.create(
            product=product,
            media_type=media_type,
            file=f,
            title=title,
        )
        created.append(ProductInfluencerMediaSerializer(obj, context={'request': request}).data)

    return Response(created, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_influencer_media(request, product_id):
    """Influencers and admins can view collab media for a product."""
    if request.user.user_type not in ('influencer', 'admin') and not request.user.is_staff:
        return Response({'error': 'Influencers only'}, status=status.HTTP_403_FORBIDDEN)

    product = get_object_or_404(Product, pk=product_id)
    qs = ProductInfluencerMedia.objects.filter(product=product).order_by('-uploaded_at')
    serializer = ProductInfluencerMediaSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_influencer_media(request, media_id):
    """Admin deletes a specific influencer media item."""
    if not (request.user.is_staff or request.user.user_type == 'admin'):
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    obj = get_object_or_404(ProductInfluencerMedia, pk=media_id)
    if obj.file:
        try:
            obj.file.delete(save=False)
        except Exception:
            pass
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


def _strip_html(html_string):
    """Remove HTML tags and decode entities to plain text."""
    if not html_string:
        return ''
    text = re.sub(r'<br\s*/?>', '\n', html_string, flags=re.IGNORECASE)
    text = re.sub(r'<li[^>]*>', '\n• ', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    # Collapse whitespace but keep newlines
    lines = [' '.join(line.split()) for line in text.split('\n')]
    return '\n'.join(line for line in lines if line).strip()


CATEGORY_ICON_MAP = {
    'electronics': '💻', 'mobiles': '📱', 'fashion': '👗', 'beauty': '💄',
    'home': '🏠', 'kitchen': '🍳', 'sports': '⚽', 'books': '📚',
    'toys': '🧸', 'health': '💊', 'grocery': '🛒', 'automotive': '🚗',
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_shopify_csv(request):
    """
    Import products from a Shopify-format CSV file.
    Accepts multipart/form-data with a 'file' field.
    The authenticated user becomes the seller for all imported products.
    """
    if request.user.user_type not in ('seller', 'admin') and not request.user.is_staff:
        return Response({'error': 'Only sellers or admins can import products'}, status=status.HTTP_403_FORBIDDEN)

    csv_file = request.FILES.get('file')
    if not csv_file:
        return Response({'error': 'No file provided. Upload a CSV file with key "file".'}, status=status.HTTP_400_BAD_REQUEST)

    if not csv_file.name.endswith('.csv'):
        return Response({'error': 'File must be a .csv file'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded = csv_file.read().decode('utf-8-sig')
    except UnicodeDecodeError:
        try:
            csv_file.seek(0)
            decoded = csv_file.read().decode('latin-1')
        except Exception:
            return Response({'error': 'Could not decode file. Use UTF-8 or Latin-1 encoding.'}, status=status.HTTP_400_BAD_REQUEST)

    reader = csv.DictReader(io.StringIO(decoded))

    # Group rows by Handle (Shopify uses multiple rows per product for extra images)
    products_map = {}
    for row in reader:
        handle = (row.get('Handle') or '').strip()
        if not handle:
            continue
        if handle not in products_map:
            products_map[handle] = {'main': row, 'extra_images': []}
        else:
            img = (row.get('Image Src') or '').strip()
            if img:
                products_map[handle]['extra_images'].append(img)

    if not products_map:
        return Response({'error': 'No valid products found in CSV. Make sure it has a "Handle" column.'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    errors = []

    with transaction.atomic():
        for handle, data in products_map.items():
            row = data['main']
            try:
                title = (row.get('Title') or '').strip()
                if not title:
                    errors.append(f'{handle}: Missing title, skipped')
                    continue

                # Price
                price_str = (row.get('Variant Price') or '0').strip()
                try:
                    price = Decimal(price_str)
                except (InvalidOperation, ValueError):
                    price = Decimal('0')

                if price <= 0:
                    errors.append(f'{handle}: Invalid price "{price_str}", skipped')
                    continue

                # Compare-at price → discount_price
                compare_str = (row.get('Variant Compare At Price') or '').strip()
                discount_price = None
                if compare_str:
                    try:
                        compare_price = Decimal(compare_str)
                        if compare_price > price:
                            discount_price = price
                            price = compare_price
                    except (InvalidOperation, ValueError):
                        pass

                # Description
                body_html = row.get('Body (HTML)') or ''
                description = _strip_html(body_html) or title

                # Brand / Vendor
                vendor = (row.get('Vendor') or 'Unknown').strip()
                brand_obj, _ = Brand.objects.get_or_create(name=vendor)

                # Category
                cat_raw = (
                    row.get('Custom Product Type')
                    or row.get('Standardized Product Type')
                    or row.get('Tags')
                    or 'General'
                ).strip()
                cat_name = cat_raw.split(',')[0].strip().title()[:100]
                icon = CATEGORY_ICON_MAP.get(cat_name.lower(), '📦')
                Category.objects.get_or_create(name=cat_name, defaults={'icon': icon})

                # Stock
                stock_str = (row.get('Variant Inventory Qty') or '0').strip()
                try:
                    stock = max(0, int(stock_str))
                except (ValueError, TypeError):
                    stock = 0

                # Images
                main_image = (row.get('Image Src') or '').strip()
                extra_images = data['extra_images']

                # Weight for delivery info
                weight_str = (row.get('Variant Grams') or '0').strip()
                try:
                    weight_grams = int(float(weight_str))
                except (ValueError, TypeError):
                    weight_grams = 0

                if weight_grams > 5000:
                    delivery = 'Standard delivery in 5-7 days'
                elif weight_grams > 1000:
                    delivery = 'Free delivery in 3-5 days'
                else:
                    delivery = 'Free delivery by Tomorrow'

                # Specifications from available CSV data
                specs = []
                sku = (row.get('Variant SKU') or '').strip()
                if sku:
                    specs.append({'name': 'SKU', 'value': sku})
                if weight_grams:
                    specs.append({'name': 'Weight', 'value': f'{weight_grams}g'})
                barcode = (row.get('Variant Barcode') or '').strip()
                if barcode:
                    specs.append({'name': 'Barcode', 'value': barcode})

                product = Product.objects.create(
                    seller=request.user,
                    name=title[:255],
                    category=cat_name,
                    brand=vendor[:100],
                    price=price,
                    discount_price=discount_price,
                    description=description,
                    stock=stock,
                    delivery=delivery,
                    image=main_image,
                    images=extra_images,
                    specifications=specs,
                )
                created.append({'id': product.id, 'name': product.name, 'price': str(product.price)})

            except Exception as e:
                errors.append(f'{handle}: {str(e)}')

    return Response({
        'message': f'Successfully imported {len(created)} products',
        'created_count': len(created),
        'error_count': len(errors),
        'created': created,
        'errors': errors[:50],
    }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)


# ── Seller Storefront ────────────────────────────────────────────────────────

class SellerStorefrontView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, seller_id):
        from accounts.models import User, SellerProfile
        from .models import SellerReview
        try:
            seller = User.objects.get(id=seller_id, user_type='seller')
        except User.DoesNotExist:
            return Response({'error': 'Seller not found'}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(seller, 'seller_profile', None)
        if not profile or profile.verification_status != 'approved':
            return Response({'error': 'Seller store not available'}, status=status.HTTP_404_NOT_FOUND)

        products = Product.objects.filter(seller=seller).order_by('-created_at')
        avg = SellerReview.objects.filter(seller=seller).aggregate(
            avg=Avg('rating'))['avg'] or 0
        review_count = SellerReview.objects.filter(seller=seller).count()

        from .serializers import ProductSerializer, SellerReviewSerializer
        reviews = SellerReview.objects.filter(seller=seller)[:10]

        return Response({
            'seller': {
                'id': seller.id,
                'store_name': profile.store_name,
                'username': seller.username,
                'avg_rating': round(float(avg), 1),
                'review_count': review_count,
                'member_since': seller.created_at.isoformat(),
                'product_count': products.count(),
            },
            'products': ProductSerializer(products, many=True).data,
            'reviews': SellerReviewSerializer(reviews, many=True).data,
        })


# ── Seller Reviews ───────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
def seller_reviews(request, seller_id):
    from accounts.models import User
    from .models import SellerReview, OrderItem
    from .serializers import SellerReviewSerializer

    try:
        seller = User.objects.get(id=seller_id, user_type='seller')
    except User.DoesNotExist:
        return Response({'error': 'Seller not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        reviews = SellerReview.objects.filter(seller=seller)
        return Response(SellerReviewSerializer(reviews, many=True).data)

    if not request.user.is_authenticated:
        return Response({'error': 'Login required'}, status=status.HTTP_401_UNAUTHORIZED)

    order_id = request.data.get('order')
    rating = request.data.get('rating', 5)
    comment = request.data.get('comment', '')

    if not order_id:
        return Response({'error': 'Order ID required'}, status=status.HTTP_400_BAD_REQUEST)

    order = get_object_or_404(Order, id=order_id, user=request.user, status='delivered')
    has_seller_items = OrderItem.objects.filter(
        order=order, product__seller=seller).exists()
    if not has_seller_items:
        return Response({'error': 'No items from this seller in your order'}, status=status.HTTP_400_BAD_REQUEST)

    if SellerReview.objects.filter(buyer=request.user, seller=seller, order=order).exists():
        return Response({'error': 'Already reviewed this seller for this order'}, status=status.HTTP_400_BAD_REQUEST)

    review = SellerReview.objects.create(
        buyer=request.user, seller=seller, order=order,
        rating=min(max(int(rating), 1), 5), comment=comment,
    )
    return Response(SellerReviewSerializer(review).data, status=status.HTTP_201_CREATED)


# ── Seller Earnings & Payouts ────────────────────────────────────────────────

class SellerEarningsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import SellerPayout
        user = request.user
        if user.user_type != 'seller':
            return Response({'error': 'Sellers only'}, status=status.HTTP_403_FORBIDDEN)

        delivered_items = OrderItem.objects.filter(
            product__seller=user,
            order__status='delivered',
            order__payment_status='completed'
        )
        total_revenue = delivered_items.aggregate(
            total=Sum(F('price') * F('quantity'))
        )['total'] or Decimal('0')

        commission_rate = 10
        try:
            ss = StoreSettings.objects.first()
            if ss and ss.settings_data:
                commission_rate = ss.settings_data.get('global_commission_rate', 10)
        except Exception:
            pass

        platform_fee = total_revenue * Decimal(str(commission_rate)) / Decimal('100')
        net_earnings = total_revenue - platform_fee

        completed = SellerPayout.objects.filter(
            seller=user, status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        pending = SellerPayout.objects.filter(
            seller=user, status__in=['pending', 'processing']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        available = max(net_earnings - completed - pending, Decimal('0'))

        return Response({
            'total_revenue': str(total_revenue),
            'commission_rate': commission_rate,
            'platform_fee': str(platform_fee),
            'net_earnings': str(net_earnings),
            'completed_payouts': str(completed),
            'pending_payouts': str(pending),
            'available_balance': str(available),
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def seller_withdraw(request):
    from .models import SellerPayout
    from .serializers import SellerPayoutSerializer

    user = request.user
    if user.user_type != 'seller':
        return Response({'error': 'Sellers only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        amount = Decimal(str(request.data.get('amount', 0)))
    except (InvalidOperation, TypeError):
        return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

    if amount < Decimal('100'):
        return Response({'error': 'Minimum withdrawal is INR 100'}, status=status.HTTP_400_BAD_REQUEST)

    delivered_items = OrderItem.objects.filter(
        product__seller=user, order__status='delivered', order__payment_status='completed'
    )
    total_revenue = delivered_items.aggregate(
        total=Sum(F('price') * F('quantity'))
    )['total'] or Decimal('0')

    commission_rate = 10
    try:
        ss = StoreSettings.objects.first()
        if ss and ss.settings_data:
            commission_rate = ss.settings_data.get('global_commission_rate', 10)
    except Exception:
        pass

    net = total_revenue - (total_revenue * Decimal(str(commission_rate)) / Decimal('100'))
    used = SellerPayout.objects.filter(
        seller=user, status__in=['pending', 'processing', 'completed']
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    if amount > (net - used):
        return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

    payout = SellerPayout.objects.create(seller=user, amount=amount)
    return Response(SellerPayoutSerializer(payout).data, status=status.HTTP_201_CREATED)


class SellerPayoutHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import SellerPayoutSerializer
        return SellerPayoutSerializer

    def get_queryset(self):
        from .models import SellerPayout
        return SellerPayout.objects.filter(seller=self.request.user)


# ── Admin Payout Management ─────────────────────────────────────────────────

class AdminPayoutListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        from .serializers import SellerPayoutSerializer
        return SellerPayoutSerializer

    def get_queryset(self):
        from .models import SellerPayout
        qs = SellerPayout.objects.select_related('seller').all()
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_process_payout(request, payout_id):
    from .models import SellerPayout
    from .serializers import SellerPayoutSerializer

    if not (request.user.is_staff or request.user.user_type == 'admin'):
        return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

    payout = get_object_or_404(SellerPayout, id=payout_id)
    action = request.data.get('action')  # 'complete' or 'reject'

    if action == 'complete':
        payout.status = 'completed'
        payout.bank_reference = request.data.get('bank_reference', '')
        payout.admin_note = request.data.get('admin_note', '')
        payout.processed_at = timezone.now()
        payout.save()
    elif action == 'reject':
        payout.status = 'rejected'
        payout.admin_note = request.data.get('admin_note', 'Rejected by admin')
        payout.processed_at = timezone.now()
        payout.save()
    else:
        return Response({'error': 'Action must be "complete" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(SellerPayoutSerializer(payout).data)


class NewsletterSubscribeView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .serializers import NewsletterSubscriberSerializer
        from .models import NewsletterSubscriber
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if NewsletterSubscriber.objects.filter(email=email).exists():
            sub = NewsletterSubscriber.objects.get(email=email)
            if not sub.is_active:
                sub.is_active = True
                sub.save()
            return Response({'message': 'You are already subscribed!'}, status=status.HTTP_200_OK)
        serializer = NewsletterSubscriberSerializer(data={'email': email})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Successfully subscribed!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)