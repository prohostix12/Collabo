import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/cart.dart';
import '../auth/auth_controller.dart';

class CartController extends AsyncNotifier<Cart> {
  @override
  Future<Cart> build() async {
    final userId = ref.watch(currentUserIdProvider);
    if (userId == null) return Cart.empty;
    return ref.read(cartRepositoryProvider).fetch();
  }

  Future<void> reload() async {
    if (ref.read(currentUserIdProvider) == null) return;
    state = AsyncData(await ref.read(cartRepositoryProvider).fetch());
  }

  Future<void> add(int productId, {int quantity = 1}) async {
    final cart = await ref.read(cartRepositoryProvider).add(productId, quantity: quantity);
    state = AsyncData(cart);
  }

  /// Optimistic so the stepper feels instant; reverts if the server refuses
  /// (e.g. "Only 3 items in stock").
  Future<void> setQuantity(int itemId, int quantity) async {
    final previous = state.value;
    if (previous != null) {
      state = AsyncData(Cart(
        items: previous.items
            .map((i) => i.id == itemId ? i.copyWith(quantity: quantity) : i)
            .where((i) => i.quantity > 0)
            .toList(),
      ));
    }
    try {
      state = AsyncData(await ref.read(cartRepositoryProvider).updateQuantity(itemId, quantity));
    } catch (_) {
      if (previous != null) state = AsyncData(previous);
      rethrow;
    }
  }

  Future<void> remove(int itemId) async {
    final previous = state.value;
    if (previous != null) {
      state = AsyncData(Cart(items: previous.items.where((i) => i.id != itemId).toList()));
    }
    try {
      state = AsyncData(await ref.read(cartRepositoryProvider).remove(itemId));
    } catch (_) {
      if (previous != null) state = AsyncData(previous);
      rethrow;
    }
  }
}

final cartControllerProvider = AsyncNotifierProvider<CartController, Cart>(CartController.new);

final cartCountProvider = Provider<int>(
  (ref) => ref.watch(cartControllerProvider).value?.totalQuantity ?? 0,
);

/// Cart lines the user unticked. Storing exclusions (rather than selections)
/// keeps newly added items selected by default.
class CartDeselection extends Notifier<Set<int>> {
  @override
  Set<int> build() {
    ref.watch(currentUserIdProvider);
    return const {};
  }

  void toggle(int itemId) {
    state = state.contains(itemId) ? ({...state}..remove(itemId)) : {...state, itemId};
  }

  void setAll({required bool selected, required Iterable<int> itemIds}) {
    state = selected ? const {} : itemIds.toSet();
  }

  void clear() => state = const {};
}

final cartDeselectionProvider =
    NotifierProvider<CartDeselection, Set<int>>(CartDeselection.new);

final selectedCartItemsProvider = Provider<List<CartItem>>((ref) {
  final cart = ref.watch(cartControllerProvider).value ?? Cart.empty;
  final excluded = ref.watch(cartDeselectionProvider);
  return cart.items.where((i) => !excluded.contains(i.id)).toList();
});
