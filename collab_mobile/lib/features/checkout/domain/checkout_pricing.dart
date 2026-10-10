import '../../../data/models/cart.dart';
import '../../../data/models/store_settings.dart';

class CheckoutSummary {
  const CheckoutSummary({
    required this.itemCount,
    required this.mrpTotal,
    required this.subtotal,
    required this.couponDiscount,
    required this.deliveryCharge,
    required this.pointsRedeemed,
    required this.walletRedeemed,
    required this.payable,
    required this.freeShippingThreshold,
  });

  final int itemCount;
  final double mrpTotal;
  final double subtotal;
  final double couponDiscount;
  final double deliveryCharge;
  final double pointsRedeemed;
  final double walletRedeemed;
  final double payable;
  final double freeShippingThreshold;

  double get productDiscount => (mrpTotal - subtotal).clamp(0, double.infinity).toDouble();
  double get totalSavings => productDiscount + couponDiscount + pointsRedeemed + walletRedeemed;

  /// Matches `int(final_amount // 100)` in create_order_for_user.
  int get pointsEarned => payable ~/ 100;

  /// Rupees still needed to unlock free delivery (backend uses `subtotal > threshold`).
  double get amountToFreeShipping =>
      subtotal > freeShippingThreshold ? 0 : (freeShippingThreshold - subtotal) + 1;
}

/// Client-side mirror of `create_order_for_user` in ecommerce/views.py, so the
/// amount sent to Razorpay equals the `final_amount` the server records.
/// Arithmetic is done in paise to avoid floating point drift.
class CheckoutPricing {
  const CheckoutPricing._();

  static CheckoutSummary compute({
    required List<CartItem> items,
    required StoreSettings settings,
    Coupon? coupon,
    int rewardPoints = 0,
    bool redeemPoints = false,
    double walletBalance = 0,
    bool redeemWallet = false,
  }) {
    var mrp = 0;
    var subtotal = 0;
    var count = 0;
    for (final item in items) {
      mrp += _paise(item.product.price) * item.quantity;
      subtotal += _paise(item.product.sellingPrice) * item.quantity;
      count += item.quantity;
    }

    // int(Decimal(subtotal) * pct / 100) -> whole rupees, truncated.
    var couponDiscount = 0;
    if (coupon != null && subtotal > 0) {
      final rupees = (subtotal * coupon.discountPercent / 10000 + 1e-9).floor();
      couponDiscount = rupees * 100;
    }

    final threshold = _paise(settings.freeShippingThreshold);
    final delivery = subtotal > threshold ? 0 : _paise(settings.shippingCharge);

    var finalAmount = subtotal - couponDiscount + delivery;

    var points = 0;
    if (redeemPoints && rewardPoints >= 100) {
      final pointsRupees = rewardPoints < finalAmount ~/ 100 ? rewardPoints : finalAmount ~/ 100;
      points = pointsRupees * 100;
      finalAmount -= points;
    }

    var wallet = 0;
    final balance = _paise(walletBalance);
    if (redeemWallet && balance > 0 && finalAmount > 0) {
      wallet = balance < finalAmount ? balance : finalAmount;
      finalAmount -= wallet;
    }

    return CheckoutSummary(
      itemCount: count,
      mrpTotal: mrp / 100,
      subtotal: subtotal / 100,
      couponDiscount: couponDiscount / 100,
      deliveryCharge: delivery / 100,
      pointsRedeemed: points / 100,
      walletRedeemed: wallet / 100,
      payable: finalAmount / 100,
      freeShippingThreshold: settings.freeShippingThreshold,
    );
  }

  static int _paise(double rupees) => (rupees * 100).round();
}
