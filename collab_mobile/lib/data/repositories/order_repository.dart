import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/order.dart';
import '../models/paginated.dart';

class RazorpayOrder {
  const RazorpayOrder({
    required this.orderId,
    required this.amountPaise,
    required this.currency,
    required this.keyId,
    required this.isMock,
  });

  factory RazorpayOrder.fromJson(Map<String, dynamic> j) => RazorpayOrder(
        orderId: asString(j['rzp_order_id']),
        amountPaise: asInt(j['amount']),
        currency: asString(j['currency'], 'INR'),
        keyId: asString(j['key_id']),
        isMock: asBool(j['is_mock']),
      );

  final String orderId;
  final int amountPaise;
  final String currency;
  final String keyId;

  /// The backend falls back to a simulated order when Razorpay keys aren't
  /// configured or the Razorpay API call fails.
  final bool isMock;
}

/// Fields shared by COD placement and Razorpay verification; both end up in
/// `create_order_for_user`, which builds the order from the server-side cart.
class OrderRequest {
  const OrderRequest({
    required this.addressId,
    required this.selectedCartItemIds,
    this.couponCode,
    this.redeemPoints = false,
    this.redeemWallet = false,
  });

  final int addressId;
  final List<int> selectedCartItemIds;
  final String? couponCode;
  final bool redeemPoints;
  final bool redeemWallet;

  Map<String, dynamic> toJson() => {
        'address': addressId,
        'selected_items': selectedCartItemIds,
        'coupon_code': couponCode ?? '',
        'redeem_points': redeemPoints,
        'redeem_wallet': redeemWallet,
      };
}

class OrderRepository {
  OrderRepository(this._api);
  final ApiClient _api;

  Future<Paginated<Order>> orders({int page = 1, int pageSize = 15}) async {
    final data = await _api.get('ecommerce/orders/', query: {'page': page, 'page_size': pageSize});
    return Paginated.fromJson(data, Order.fromJson);
  }

  Future<Order> order(int id) async =>
      Order.fromJson(asMap(await _api.get('ecommerce/orders/$id/')));

  Future<OrderTracking> track(int id) async =>
      OrderTracking.fromJson(asMap(await _api.get('ecommerce/orders/$id/track/')));

  Future<Order> cancel(int id, {required String reason, required String comment}) async =>
      Order.fromJson(asMap(await _api.post(
        'ecommerce/orders/$id/cancel/',
        data: {'reason': reason, 'comment': comment.trim()},
      )));

  Future<Order> requestReturn(int id, {required String reason, required String comment}) async =>
      Order.fromJson(asMap(await _api.post(
        'ecommerce/orders/$id/return/',
        data: {'reason': reason, 'comment': comment.trim()},
      )));

  Future<PlacedOrder> placeCashOnDelivery(OrderRequest request) async {
    final data = asMap(await _api.post(
      'ecommerce/orders/',
      data: {...request.toJson(), 'payment_method': 'cod'},
    ));
    return PlacedOrder(
      orderId: asString(data['order_id']),
      expectedDelivery: asDate(data['expected_delivery_date']),
    );
  }

  Future<RazorpayOrder> createRazorpayOrder(double amountRupees) async => RazorpayOrder.fromJson(
        asMap(await _api.post('ecommerce/razorpay/create-order/', data: {'amount': amountRupees})),
      );

  Future<PlacedOrder> verifyRazorpayPayment({
    required OrderRequest request,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final data = asMap(await _api.post('ecommerce/razorpay/verify-payment/', data: {
      ...request.toJson(),
      'razorpay_order_id': razorpayOrderId,
      'razorpay_payment_id': razorpayPaymentId,
      'razorpay_signature': razorpaySignature,
    }));
    return PlacedOrder(
      orderId: asString(data['order_id']),
      paymentId: asString(data['razorpay_payment_id']),
    );
  }
}
