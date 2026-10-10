import 'package:collabo/data/models/order.dart';
import 'package:collabo/data/models/paginated.dart';
import 'package:collabo/data/models/product.dart';
import 'package:collabo/data/models/store_settings.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Product parses the live ProductSerializer shape', () {
    // Trimmed from GET https://collabo.co.in/api/ecommerce/products/24/
    final p = Product.fromJson({
      'id': 24,
      'seller': 1,
      'seller_username': 'prohostix',
      'status': 'approved',
      'name': 'Adjustable Laptop Stand',
      'category': 'Gadgets & Electronics',
      'brand': '',
      'vendor': 1,
      'vendor_details': {
        'id': 1,
        'name': 'DeoDap',
        'return_policy': '7 Days Return Policy',
        'delivery_time': 'Delivery within 5 -6 Days',
        'delivery_charge': '49.00',
      },
      'return_policy': '',
      'price': '1899.00',
      'discount_price': '299.00',
      'discount_percent': 84,
      'rating': '4.00',
      'reviews_count': 2,
      'image': 'https://deodap.in/cdn/shop/files/01.jpg?width=990',
      'images': ['https://deodap.in/cdn/shop/files/01.jpg?width=990', 'https://deodap.in/a.jpg'],
      'colors': [],
      'stock': 61,
      'delivery': '',
      'specifications': [
        {'name': 'Material', 'value': 'Aluminum'},
      ],
      'highlights': ['Ergonomic design'],
      'offers': [
        {'title': 'Bank offer'},
        'Flat 5% off',
      ],
      'qa_section': [
        {'q': 'Foldable?', 'a': 'Yes'},
      ],
      'product_shipping_charge': '49.00',
    });

    expect(p.sellingPrice, 299);
    expect(p.price, 1899);
    expect(p.hasDiscount, isTrue);
    expect(p.effectiveDiscountPercent, 84);
    expect(p.rating, 4);
    expect(p.gallery, hasLength(2), reason: 'duplicate primary image is removed');
    expect(p.specifications.single.value, 'Aluminum');
    expect(p.offers, ['Bank offer', 'Flat 5% off']);
    expect(p.qa.single.answer, 'Yes');
    expect(p.displayReturnPolicy, '7 Days Return Policy', reason: 'falls back to vendor');
    expect(p.displayDelivery, 'Delivery within 5 -6 Days');
  });

  test('Paginated reads DRF envelopes and bare lists', () {
    final page = Paginated.fromJson(
      {'count': 103, 'next': 'https://x/?page=2', 'previous': null, 'results': [{'id': 1, 'name': 'Home', 'icon': ''}]},
      Category.fromJson,
    );
    expect(page.count, 103);
    expect(page.hasMore, isTrue);
    expect(page.items.single.name, 'Home');

    final bare = Paginated.fromJson([
      {'id': 2, 'name': 'Kids', 'icon': ''},
    ], Category.fromJson);
    expect(bare.hasMore, isFalse);
    expect(bare.items.single.id, 2);
  });

  group('Order rules mirror OrderViewSet', () {
    Map<String, dynamic> json(String status, {DateTime? updated}) => {
          'id': 7,
          'order_id': 'ORD-1234567',
          'status': status,
          'payment_method': 'cod',
          'payment_status': 'pending',
          'final_amount': '549.00',
          'items': [
            {'id': 1, 'product': 24, 'price': '299.00', 'quantity': 2, 'product_details': null},
          ],
          'created_at': '2026-10-01T10:00:00Z',
          'updated_at': (updated ?? DateTime.now()).toUtc().toIso8601String(),
        };

    test('cancel allowed only before delivery', () {
      expect(Order.fromJson(json('processing')).canCancel, isTrue);
      expect(Order.fromJson(json('shipped')).canCancel, isTrue);
      expect(Order.fromJson(json('delivered')).canCancel, isFalse);
      expect(Order.fromJson(json('cancelled')).canCancel, isFalse);
    });

    test('return allowed within 7 days of delivery', () {
      expect(Order.fromJson(json('delivered')).canReturn, isTrue);
      final old = DateTime.now().subtract(const Duration(days: 8));
      expect(Order.fromJson(json('delivered', updated: old)).canReturn, isFalse);
      expect(Order.fromJson(json('shipped')).canReturn, isFalse);
    });

    test('parses amounts, items and labels', () {
      final o = Order.fromJson(json('return_requested'));
      expect(o.status, OrderStatus.returnRequested);
      expect(o.finalAmount, 549);
      expect(o.itemCount, 2);
      expect(o.items.single.name, 'Product #24');
      expect(o.paymentLabel, 'Cash on Delivery');
    });
  });

  test('StoreSettings uses backend defaults when fields are missing', () {
    final s = StoreSettings.fromJson({
      'coupon_codes': [
        {'code': 'firstbuy', 'discount_percent': 10, 'description': 'First order'},
      ],
      'trending_product_ids': [5, '6', 4],
    });
    expect(s.shippingCharge, 99);
    expect(s.freeShippingThreshold, 500);
    expect(s.findCoupon('FIRSTBUY')?.discountPercent, 10);
    expect(s.trendingProductIds, [5, 6, 4]);
  });
}
