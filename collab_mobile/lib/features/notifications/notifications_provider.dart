import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/order.dart';
import '../auth/auth_controller.dart';
import '../orders/order_providers.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    required this.icon,
    required this.orderId,
    this.order,
  });

  final String id;
  final String title;
  final String body;
  final DateTime time;
  final IconData icon;
  final int orderId;
  final Order? order;
}

/// The backend sends order updates over WhatsApp/email and has no
/// notification API, so the in-app feed is derived from the user's real
/// order timeline (placed, shipped, delivered, cancelled, returns).
final notificationsProvider = FutureProvider<List<AppNotification>>((ref) async {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) return const [];
  final page = await ref.watch(ordersProvider.future);
  final events = <AppNotification>[];

  for (final o in page.items) {
    final first = o.items.isEmpty ? 'your items' : o.items.first.name;
    final more = o.items.length > 1 ? ' and ${o.items.length - 1} more' : '';
    final what = '$first$more';

    if (o.createdAt != null) {
      events.add(AppNotification(
        id: '${o.id}-placed',
        title: 'Order ${o.orderId} placed',
        body: 'We received your order for $what.',
        time: o.createdAt!,
        icon: Icons.receipt_long_rounded,
        orderId: o.id,
        order: o,
      ));
    }
    if (o.shippedAt != null) {
      events.add(AppNotification(
        id: '${o.id}-shipped',
        title: 'Order ${o.orderId} shipped',
        body: o.shippingProvider.isNotEmpty
            ? 'On its way with ${o.shippingProvider}. Tracking: ${o.trackingNumber}'
            : '$what is on its way.',
        time: o.shippedAt!,
        icon: Icons.local_shipping_rounded,
        orderId: o.id,
        order: o,
      ));
    }
    if (o.status == OrderStatus.delivered && o.updatedAt != null) {
      events.add(AppNotification(
        id: '${o.id}-delivered',
        title: 'Order ${o.orderId} delivered',
        body: 'Enjoying $first? Rate it to help other shoppers.',
        time: o.updatedAt!,
        icon: Icons.inventory_2_rounded,
        orderId: o.id,
        order: o,
      ));
    }
    if (o.cancelledAt != null) {
      events.add(AppNotification(
        id: '${o.id}-cancelled',
        title: 'Order ${o.orderId} cancelled',
        body: o.cancelReason.isNotEmpty ? 'Reason: ${o.cancelReason}' : 'Your order was cancelled.',
        time: o.cancelledAt!,
        icon: Icons.cancel_rounded,
        orderId: o.id,
        order: o,
      ));
    }
    if (o.returnRequestedAt != null) {
      events.add(AppNotification(
        id: '${o.id}-return',
        title: 'Return requested for ${o.orderId}',
        body: 'Current status: ${o.status.label}.',
        time: o.returnRequestedAt!,
        icon: Icons.assignment_return_rounded,
        orderId: o.id,
        order: o,
      ));
    }
  }
  events.sort((a, b) => b.time.compareTo(a.time));
  return events;
});

class NotificationsSeen extends Notifier<DateTime?> {
  String _key(int userId) => 'collabo.notifications_seen.$userId';

  @override
  DateTime? build() {
    final userId = ref.watch(currentUserIdProvider);
    if (userId == null) return null;
    final ms = ref.watch(sharedPreferencesProvider).getInt(_key(userId));
    // First launch for this account: treat existing history as already seen.
    if (ms == null) {
      final now = DateTime.now();
      ref.read(sharedPreferencesProvider).setInt(_key(userId), now.millisecondsSinceEpoch);
      return now;
    }
    return DateTime.fromMillisecondsSinceEpoch(ms);
  }

  void markAllSeen() {
    final userId = ref.read(currentUserIdProvider);
    if (userId == null) return;
    final now = DateTime.now();
    ref.read(sharedPreferencesProvider).setInt(_key(userId), now.millisecondsSinceEpoch);
    state = now;
  }
}

final notificationsSeenProvider =
    NotifierProvider<NotificationsSeen, DateTime?>(NotificationsSeen.new);

final unreadNotificationsProvider = Provider<int>((ref) {
  final seen = ref.watch(notificationsSeenProvider);
  final list = ref.watch(notificationsProvider).value ?? const <AppNotification>[];
  if (seen == null) return 0;
  return list.where((n) => n.time.isAfter(seen)).length;
});
