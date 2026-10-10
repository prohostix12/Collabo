import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/paged_notifier.dart';
import '../../core/providers.dart';
import '../../data/models/paginated.dart';
import '../../data/models/product.dart';
import '../../data/models/store_settings.dart';

final storeSettingsProvider = FutureProvider<StoreSettings>(
  (ref) => ref.watch(catalogRepositoryProvider).storeSettings(),
);

final categoriesProvider = FutureProvider<List<Category>>(
  (ref) => ref.watch(catalogRepositoryProvider).categories(),
);

final brandsProvider = FutureProvider<List<Brand>>(
  (ref) => ref.watch(catalogRepositoryProvider).brands(),
);

final productProvider = FutureProvider.autoDispose.family<Product, int>(
  (ref, id) => ref.watch(catalogRepositoryProvider).product(id),
);

enum CuratedSection { deals, weeklyDeals, trending, trendingPhones }

final curatedProductsProvider = FutureProvider.family<List<Product>, CuratedSection>((ref, section) async {
  final settings = await ref.watch(storeSettingsProvider.future);
  final ids = switch (section) {
    CuratedSection.deals => settings.showDeals ? settings.dealsProductIds : const <int>[],
    CuratedSection.weeklyDeals => settings.showWeeklyDeals ? settings.weeklyDealsProductIds : const <int>[],
    CuratedSection.trending => settings.trendingProductIds,
    CuratedSection.trendingPhones => settings.trendingPhonesProductIds,
  };
  if (ids.isEmpty) return const [];
  return ref.watch(catalogRepositoryProvider).productsByIds(ids.take(12).toList());
});

/// Small, non-paginated shelves for the home screen.
final productShelfProvider = FutureProvider.family<List<Product>, ProductQuery>((ref, query) async {
  final page = await ref.watch(catalogRepositoryProvider).products(query, pageSize: 10);
  return page.items;
});

/// One request worth of products the home sections slice client-side
/// (top deals, popular picks, budget store, category spotlights, brands).
final productPoolProvider = FutureProvider<List<Product>>((ref) async {
  final page = await ref.watch(catalogRepositoryProvider).products(const ProductQuery(), pageSize: 100);
  return page.items;
});

/// Phones fetched straight from the Mobiles category, so the brand row does
/// not depend on phones happening to be in the first 100 products.
final mobileProductsProvider = FutureProvider<List<Product>>((ref) async {
  final cats = await ref.watch(categoriesProvider.future);
  final matches = cats.where((c) => RegExp(r'mobile|phone', caseSensitive: false).hasMatch(c.name)).toList();
  if (matches.isEmpty) return const [];
  matches.sort((a, b) {
    int rank(Category c) => RegExp(r'^mobiles?$', caseSensitive: false).hasMatch(c.name.trim()) ? 0 : 1;
    return rank(a).compareTo(rank(b));
  });
  final page = await ref
      .watch(catalogRepositoryProvider)
      .products(ProductQuery(category: matches.first.name), pageSize: 60);
  return page.items;
});

/// Product ids the shopper opened most recently, newest first.
class RecentlyViewed extends Notifier<List<int>> {
  static const _key = 'collabo.recent_viewed';

  @override
  List<int> build() =>
      (ref.watch(sharedPreferencesProvider).getStringList(_key) ?? const []).map(int.tryParse).whereType<int>().toList();

  void add(int id) {
    state = [id, ...state.where((e) => e != id)].take(12).toList();
    ref.read(sharedPreferencesProvider).setStringList(_key, state.map((e) => '$e').toList());
  }
}

final recentlyViewedProvider = NotifierProvider<RecentlyViewed, List<int>>(RecentlyViewed.new);

final recentlyViewedProductsProvider = FutureProvider<List<Product>>((ref) async {
  final ids = ref.watch(recentlyViewedProvider);
  if (ids.isEmpty) return const [];
  final items = await ref.watch(catalogRepositoryProvider).productsByIds(ids);
  final byId = {for (final p in items) p.id: p};
  return [for (final id in ids) if (byId[id] != null) byId[id]!];
});

/// First product image per category, as the website's "Shop By Category" tiles use.
final categoryCoversProvider = FutureProvider<Map<String, String>>((ref) async {
  final items = await ref.watch(productPoolProvider.future);
  final covers = <String, String>{};
  for (final p in items) {
    if (p.category.isNotEmpty && p.image.isNotEmpty) covers.putIfAbsent(p.category, () => p.image);
  }
  return covers;
});

/// Coupon tapped on a home banner, applied automatically when checkout opens.
class PendingCoupon extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? code) => state = code;
}

final pendingCouponProvider = NotifierProvider<PendingCoupon, String?>(PendingCoupon.new);

class ProductListController extends PagedNotifier<Product> {
  ProductListController(this.query);
  final ProductQuery query;

  @override
  Future<Paginated<Product>> fetchPage(int page) =>
      ref.read(catalogRepositoryProvider).products(query, page: page);
}

final productListProvider = AsyncNotifierProvider.autoDispose
    .family<ProductListController, PagedData<Product>, ProductQuery>(ProductListController.new);

final productReviewsProvider = FutureProvider.autoDispose.family<Paginated<CustomerReview>, int>(
  (ref, productId) => ref.watch(catalogRepositoryProvider).reviews(productId),
);
