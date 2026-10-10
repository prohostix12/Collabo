import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/paged_notifier.dart';
import '../../core/providers.dart';
import '../../data/models/order.dart';
import '../../data/models/paginated.dart';
import '../auth/auth_controller.dart';

class OrdersController extends PagedNotifier<Order> {
  @override
  Future<PagedData<Order>> build() {
    ref.watch(currentUserIdProvider);
    return super.build();
  }

  @override
  Future<Paginated<Order>> fetchPage(int page) =>
      ref.read(orderRepositoryProvider).orders(page: page);

  /// Swaps in an updated order (after cancel/return) without a full reload.
  void replace(Order order) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(current.copyWith(
      items: [for (final o in current.items) o.id == order.id ? order : o],
    ));
  }
}

final ordersProvider =
    AsyncNotifierProvider<OrdersController, PagedData<Order>>(OrdersController.new);

final orderDetailProvider = FutureProvider.autoDispose.family<Order, int>(
  (ref, id) => ref.watch(orderRepositoryProvider).order(id),
);

final orderTrackingProvider = FutureProvider.autoDispose.family<OrderTracking?, int>((ref, id) async {
  try {
    return await ref.watch(orderRepositoryProvider).track(id);
  } catch (_) {
    // 404 "No tracking info" until the seller ships; tracking is optional UI.
    return null;
  }
});
