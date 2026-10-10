import 'package:collabo/data/models/cart.dart';
import 'package:collabo/data/models/store_settings.dart';
import 'package:collabo/features/checkout/domain/checkout_pricing.dart';
import 'package:flutter_test/flutter_test.dart';

CartItem _item({required String price, String? discountPrice, int qty = 1, int id = 1}) => CartItem.fromJson({
      'id': id,
      'quantity': qty,
      'product_details': {
        'id': id,
        'name': 'Item $id',
        'price': price,
        'discount_price': discountPrice,
        'stock': 10,
      },
    });

StoreSettings _settings({num shipping = 49, num threshold = 500, List<Map<String, dynamic>> coupons = const []}) =>
    StoreSettings.fromJson({
      'shipping_charge': shipping,
      'free_shipping_threshold': threshold,
      'coupon_codes': coupons,
    });

/// Expected values are worked through create_order_for_user in
/// backend/ecommerce/views.py by hand.
void main() {
  group('CheckoutPricing mirrors create_order_for_user', () {
    test('free delivery above threshold, truncated coupon, points then wallet', () {
      final settings = _settings(coupons: [
        {'code': 'COLLABO10', 'discount_percent': 10, 'description': ''},
      ]);
      final s = CheckoutPricing.compute(
        items: [_item(price: '1899.00', discountPrice: '299.00', qty: 2)],
        settings: settings,
        coupon: settings.findCoupon('collabo10'),
        rewardPoints: 150,
        redeemPoints: true,
        walletBalance: 50,
        redeemWallet: true,
      );
      expect(s.mrpTotal, 3798);
      expect(s.subtotal, 598);
      expect(s.couponDiscount, 59); // int(598 * 10 / 100) = int(59.8)
      expect(s.deliveryCharge, 0); // 598 > 500
      expect(s.pointsRedeemed, 150); // min(150, int(539))
      expect(s.walletRedeemed, 50);
      expect(s.payable, 339);
      expect(s.pointsEarned, 3); // int(339 // 100)
    });

    test('delivery is charged when subtotal equals the threshold (strict >)', () {
      final s = CheckoutPricing.compute(
        items: [_item(price: '500.00', discountPrice: '500.00')],
        settings: _settings(),
      );
      expect(s.deliveryCharge, 49);
      expect(s.payable, 549);
      expect(s.amountToFreeShipping, greaterThan(0));
    });

    test('points are ignored below the 100-point minimum', () {
      final s = CheckoutPricing.compute(
        items: [_item(price: '200', discountPrice: '150')],
        settings: _settings(),
        rewardPoints: 99,
        redeemPoints: true,
      );
      expect(s.pointsRedeemed, 0);
      expect(s.payable, 199);
    });

    test('points are capped at the whole-rupee order total', () {
      final s = CheckoutPricing.compute(
        items: [_item(price: '120.50', discountPrice: '120.50')],
        settings: _settings(shipping: 0),
        rewardPoints: 1000,
        redeemPoints: true,
      );
      expect(s.pointsRedeemed, 120); // min(1000, int(120.50))
      expect(s.payable, closeTo(0.5, 1e-9));
    });

    test('wallet never takes the total below zero', () {
      final s = CheckoutPricing.compute(
        items: [_item(price: '300', discountPrice: '250')],
        settings: _settings(),
        walletBalance: 1000,
        redeemWallet: true,
      );
      expect(s.walletRedeemed, 299);
      expect(s.payable, 0);
    });

    test('falls back to MRP when discount_price is null', () {
      final s = CheckoutPricing.compute(
        items: [_item(price: '799.00', qty: 1)],
        settings: _settings(),
      );
      expect(s.subtotal, 799);
      expect(s.productDiscount, 0);
    });

    test('unknown coupon codes are not applied', () {
      expect(_settings().findCoupon('NOPE'), isNull);
    });
  });
}
