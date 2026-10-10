import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/product.dart';
import '../auth/auth_controller.dart';

/// Product ids in the wishlist; drives every heart icon in the app.
class WishlistController extends AsyncNotifier<Set<int>> {
  @override
  Future<Set<int>> build() async {
    final userId = ref.watch(currentUserIdProvider);
    if (userId == null) return const {};
    return ref.read(wishlistRepositoryProvider).ids();
  }

  /// Returns true when the product ends up in the wishlist.
  Future<bool> toggle(int productId) async {
    final previous = state.value ?? const <int>{};
    final adding = !previous.contains(productId);
    state = AsyncData(adding ? {...previous, productId} : ({...previous}..remove(productId)));
    try {
      final added = await ref.read(wishlistRepositoryProvider).toggle(productId);
      final current = state.value ?? const <int>{};
      state = AsyncData(added ? {...current, productId} : ({...current}..remove(productId)));
      ref.invalidate(wishlistProductsProvider);
      return added;
    } catch (_) {
      state = AsyncData(previous);
      rethrow;
    }
  }
}

final wishlistControllerProvider =
    AsyncNotifierProvider<WishlistController, Set<int>>(WishlistController.new);

final isWishlistedProvider = Provider.family<bool, int>(
  (ref, productId) => ref.watch(wishlistControllerProvider).value?.contains(productId) ?? false,
);

final wishlistProductsProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) return const [];
  return ref.read(wishlistRepositoryProvider).products();
});
