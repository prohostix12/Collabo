import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/repositories/auth_repository.dart';
import '../data/repositories/catalog_repository.dart';
import '../data/repositories/order_repository.dart';
import '../data/repositories/shopping_repository.dart';
import '../features/auth/auth_controller.dart';
import 'network/api_client.dart';
import 'storage/token_storage.dart';

/// Overridden in main() once the keystore has been read.
final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => throw UnimplementedError('tokenStorageProvider must be overridden'),
);

/// Overridden in main() once SharedPreferences has loaded.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider must be overridden'),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final client = ApiClient(ref.watch(tokenStorageProvider), prefs: ref.watch(sharedPreferencesProvider));
  client.onSessionExpired = () => ref.read(authControllerProvider.notifier).onSessionExpired();
  return client;
});

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider)),
);

final catalogRepositoryProvider =
    Provider<CatalogRepository>((ref) => CatalogRepository(ref.watch(apiClientProvider)));

final cartRepositoryProvider =
    Provider<CartRepository>((ref) => CartRepository(ref.watch(apiClientProvider)));

final wishlistRepositoryProvider =
    Provider<WishlistRepository>((ref) => WishlistRepository(ref.watch(apiClientProvider)));

final addressRepositoryProvider =
    Provider<AddressRepository>((ref) => AddressRepository(ref.watch(apiClientProvider)));

final orderRepositoryProvider =
    Provider<OrderRepository>((ref) => OrderRepository(ref.watch(apiClientProvider)));

final walletRepositoryProvider =
    Provider<WalletRepository>((ref) => WalletRepository(ref.watch(apiClientProvider)));
