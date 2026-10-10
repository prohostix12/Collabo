import '../../core/utils/json.dart';
import 'address.dart';
import 'product.dart';

enum OrderStatus {
  pending('Pending'),
  processing('Confirmed'),
  shipped('Shipped'),
  delivered('Delivered'),
  cancelled('Cancelled'),
  returnRequested('Return requested'),
  returned('Returned'),
  refunded('Refunded'),
  returnRejected('Return rejected'),
  unknown('Processing');

  const OrderStatus(this.label);
  final String label;

  static OrderStatus parse(String raw) => switch (raw) {
        'pending' => pending,
        'processing' => processing,
        'shipped' => shipped,
        'delivered' => delivered,
        'cancelled' => cancelled,
        'return_requested' => returnRequested,
        'returned' => returned,
        'refunded' => refunded,
        'return_rejected' => returnRejected,
        _ => unknown,
      };

  bool get isTerminalNegative => this == cancelled || this == returned || this == refunded;
}

class OrderItem {
  const OrderItem({
    required this.id,
    required this.productId,
    required this.product,
    required this.price,
    required this.quantity,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) {
    final details = j['product_details'];
    return OrderItem(
      id: asInt(j['id']),
      productId: asInt(j['product']),
      product: details is Map ? Product.fromJson(Map<String, dynamic>.from(details)) : null,
      price: asDouble(j['price']),
      quantity: asInt(j['quantity'], 1),
    );
  }

  final int id;
  final int productId;
  final Product? product;
  final double price;
  final int quantity;

  String get name => product?.name ?? 'Product #$productId';
  double get lineTotal => price * quantity;
}

class Order {
  const Order({
    required this.id,
    required this.orderId,
    required this.address,
    required this.totalAmount,
    required this.discountAmount,
    required this.deliveryCharge,
    required this.finalAmount,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.status,
    required this.rawStatus,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
    required this.cancelReason,
    required this.cancelComment,
    required this.cancelledAt,
    required this.returnReason,
    required this.returnComment,
    required this.returnRequestedAt,
    required this.trackingNumber,
    required this.shippingProvider,
    required this.shippedAt,
    required this.expectedDeliveryDate,
  });

  factory Order.fromJson(Map<String, dynamic> j) {
    final addr = j['address_details'];
    final raw = asString(j['status']);
    return Order(
      id: asInt(j['id']),
      orderId: asString(j['order_id']),
      address: addr is Map ? Address.fromJson(Map<String, dynamic>.from(addr)) : null,
      totalAmount: asDouble(j['total_amount']),
      discountAmount: asDouble(j['discount_amount']),
      deliveryCharge: asDouble(j['delivery_charge']),
      finalAmount: asDouble(j['final_amount']),
      paymentMethod: asString(j['payment_method']),
      paymentStatus: asString(j['payment_status']),
      status: OrderStatus.parse(raw),
      rawStatus: raw,
      items: asMapList(j['items']).map(OrderItem.fromJson).toList(),
      createdAt: asDate(j['created_at']),
      updatedAt: asDate(j['updated_at']),
      cancelReason: asString(j['cancel_reason']),
      cancelComment: asString(j['cancel_comment']),
      cancelledAt: asDate(j['cancelled_at']),
      returnReason: asString(j['return_reason']),
      returnComment: asString(j['return_comment']),
      returnRequestedAt: asDate(j['return_requested_at']),
      trackingNumber: asString(j['tracking_number']),
      shippingProvider: asString(j['shipping_provider']),
      shippedAt: asDate(j['shipped_at']),
      expectedDeliveryDate: asDate(j['expected_delivery_date']),
    );
  }

  final int id;
  final String orderId;
  final Address? address;
  final double totalAmount;
  final double discountAmount;
  final double deliveryCharge;
  final double finalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final OrderStatus status;
  final String rawStatus;
  final List<OrderItem> items;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String cancelReason;
  final String cancelComment;
  final DateTime? cancelledAt;
  final String returnReason;
  final String returnComment;
  final DateTime? returnRequestedAt;
  final String trackingNumber;
  final String shippingProvider;
  final DateTime? shippedAt;
  final DateTime? expectedDeliveryDate;

  int get itemCount => items.fold(0, (s, i) => s + i.quantity);

  /// Mirrors OrderViewSet.cancel_order's pre-dispatch check.
  bool get canCancel =>
      status == OrderStatus.pending ||
      status == OrderStatus.processing ||
      status == OrderStatus.shipped;

  /// Mirrors OrderViewSet.return_order: delivered and within 7 days of the
  /// last update.
  bool get canReturn =>
      status == OrderStatus.delivered &&
      updatedAt != null &&
      DateTime.now().difference(updatedAt!) <= const Duration(days: 7);

  bool get hasTracking => trackingNumber.isNotEmpty;

  String get paymentLabel => switch (paymentMethod) {
        'cod' => 'Cash on Delivery',
        'razorpay' => 'Paid online',
        'upi' => 'UPI',
        _ => paymentMethod.toUpperCase(),
      };
}

class TrackingEvent {
  const TrackingEvent({required this.title, required this.location, required this.date});
  final String title;
  final String location;
  final DateTime? date;
}

class OrderTracking {
  const OrderTracking({
    required this.trackingNumber,
    required this.provider,
    required this.shippedAt,
    required this.trackUrl,
    required this.events,
    required this.etd,
  });

  factory OrderTracking.fromJson(Map<String, dynamic> j) {
    final sr = asMap(asMap(j['shiprocket_tracking'])['tracking_data']);
    final events = asMapList(sr['shipment_track_activities'])
        .map((a) => TrackingEvent(
              title: asString(a['activity'] ?? a['sr-status-label'] ?? a['status']),
              location: asString(a['location']),
              date: DateTime.tryParse(asString(a['date'])),
            ))
        .where((e) => e.title.isNotEmpty)
        .toList();
    return OrderTracking(
      trackingNumber: asString(j['tracking_number']),
      provider: asString(j['shipping_provider']),
      shippedAt: asDate(j['shipped_at']),
      trackUrl: asString(sr['track_url']),
      etd: DateTime.tryParse(asString(sr['etd'])),
      events: events,
    );
  }

  final String trackingNumber;
  final String provider;
  final DateTime? shippedAt;
  final String trackUrl;
  final DateTime? etd;
  final List<TrackingEvent> events;
}

/// Result of placing an order, normalized across the COD endpoint (full order
/// payload) and Razorpay verification ({order_id, razorpay_payment_id}).
class PlacedOrder {
  const PlacedOrder({required this.orderId, this.paymentId, this.expectedDelivery});
  final String orderId;
  final String? paymentId;
  final DateTime? expectedDelivery;
}
