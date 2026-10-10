import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/product.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/motion.dart';
import '../../shared/widgets/product_widgets.dart';
import '../auth/auth_controller.dart';
import '../catalog/catalog_providers.dart';
import '../catalog/search_screen.dart' show recentSearchesProvider;


final _popularPicksProvider = Provider<List<Product>>((ref) {
  final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
  final picks = pool.where((p) => p.rating > 0 && p.inStock).toList()
    ..sort((a, b) {
      final byRating = b.rating.compareTo(a.rating);
      return byRating != 0 ? byRating : b.reviewsCount.compareTo(a.reviewsCount);
    });
  return picks.take(6).toList();
});

final _budgetTilesProvider = Provider<List<(int, List<Product>, String)>>((ref) {
  final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
  final tiles = <(int, List<Product>, String)>[];
  for (final max in [499, 999, 1999, 4999]) {
    final fit = pool.where((p) => p.sellingPrice <= max && p.image.isNotEmpty).toList();
    if (fit.isNotEmpty) {
      final repImage = fit.reduce((a, b) => a.sellingPrice > b.sellingPrice ? a : b).image;
      tiles.add((max, fit, repImage));
    }
  }
  return tiles;
});

final _topDealsProvider = Provider<List<Product>>((ref) {
  final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
  final deals = pool.where((p) => p.inStock && p.effectiveDiscountPercent >= 10).toList()
    ..sort((a, b) => b.effectiveDiscountPercent.compareTo(a.effectiveDiscountPercent));
  return deals.take(10).toList();
});

final _popularMobileBrandsProvider = Provider<(List<String>, Map<String, List<Product>>, String)?>((ref) {
  final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
  final phones = ref.watch(mobileProductsProvider).value ?? const <Product>[];
  final all = {for (final p in [...phones, ...pool]) p.id: p}.values.toList();

  const phoneBrands = {
    'apple', 'samsung', 'oneplus', 'xiaomi', 'redmi', 'realme', 'vivo', 'iqoo', 'oppo', 'nothing', 'google',
    'motorola', 'poco', 'infinix', 'tecno', 'honor', 'lava', 'nokia', 'asus', 'itel', 'huawei', 'sony', 'micromax',
  };
  bool inMobileCategory(Product p) => RegExp(r'mobile|phone', caseSensitive: false).hasMatch(p.category);

  Map<String, List<Product>> group(bool Function(Product) test) {
    final m = <String, List<Product>>{};
    for (final p in all) {
      if (p.brand.trim().isNotEmpty && test(p)) m.putIfAbsent(p.brand.trim(), () => []).add(p);
    }
    return m;
  }

  var byBrand = group((p) => inMobileCategory(p) && phoneBrands.contains(p.brand.trim().toLowerCase()));
  if (byBrand.length < 2) byBrand = group(inMobileCategory);
  if (byBrand.length < 2) byBrand = group((p) => phoneBrands.contains(p.brand.trim().toLowerCase()));
  if (byBrand.isEmpty) return null;

  final brands = byBrand.keys.toList()..sort((a, b) => byBrand[b]!.length.compareTo(byBrand[a]!.length));
  final category = byBrand.values.first.first.category;

  return (brands, byBrand, category);
});

final _categorySpotlightsProvider = Provider<List<(String, List<Product>)>>((ref) {
  final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
  final cats = ref.watch(categoriesProvider).value ?? const <Category>[];

  final groups = <(String, List<Product>)>[];
  for (final c in cats) {
    final items = pool.where((p) => p.category == c.name && p.image.isNotEmpty).toList();
    if (items.length >= 4) groups.add((c.name, items));
  }
  bool playful(String n) => RegExp('kid|toy|baby', caseSensitive: false).hasMatch(n);
  groups.sort((a, b) => (playful(b.$1) ? 1 : 0).compareTo(playful(a.$1) ? 1 : 0));
  return groups;
});



void _openProduct(BuildContext context, Product p, String tag) =>
    context.push('/product/${p.id}', extra: ProductRouteExtra(p, '$tag-${p.id}'));

String _listUrl({String? category, String? brand, int? max, String? title, String? sort}) {
  final q = <String>[
    if (category != null) 'category=${Uri.encodeQueryComponent(category)}',
    if (brand != null) 'brand=${Uri.encodeQueryComponent(brand)}',
    if (max != null) 'max=$max',
    if (sort != null) 'sort=$sort',
    if (title != null) 'title=${Uri.encodeQueryComponent(title)}',
  ];
  return '/products?${q.join('&')}';
}

/// "Good evening" row plus the shopper's own recent searches and the
/// products they opened last. Hidden until there is something to resume.
class GreetingResume extends ConsumerWidget {
  const GreetingResume({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) return const SizedBox.shrink();

    final searches = ref.watch(recentSearchesProvider);

    final viewed = ref.watch(recentlyViewedProductsProvider).value ?? const <Product>[];
    final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
    
    var displayItems = viewed.toList();
    if (displayItems.length < 4) {
      final additional = pool.where((p) => !displayItems.any((v) => v.id == p.id)).take(4 - displayItems.length);
      displayItems.addAll(additional);
    }

    if (displayItems.isEmpty) return const SizedBox.shrink();

    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');

    return FadeSlideIn(
      child: Container(
        margin: const EdgeInsets.only(top: 8),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFE8F0FE), Colors.white],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        padding: const EdgeInsets.fromLTRB(16, 14, 0, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$greeting, ${user.displayName}',
              style: context.text.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: const Color(0xFF1B3A6B)),
            ),
            const SizedBox(height: 2),
            Text('Pick up where you left off', style: context.text.bodySmall?.copyWith(color: context.palette.mutedText)),
            const SizedBox(height: 12),
            SizedBox(
              height: 118,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(right: 16),
                itemCount: displayItems.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final p = displayItems[i];
                  return PressScale(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () => _openProduct(context, p, 'resume'),
                      child: SizedBox(
                        width: 84,
                        child: Column(
                          children: [
                            Container(
                              width: 76,
                              height: 76,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                                border: Border.all(color: const Color(0xFFD7E3FB), width: 2),
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: AppImage(p.image, fit: BoxFit.contain, cacheWidth: 120, backgroundColor: Colors.white),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              p.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                              style: context.text.labelSmall?.copyWith(height: 1.15),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            if (searches.isNotEmpty) ...[
              const SizedBox(height: 10),
              SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.only(right: 16),
                  itemCount: searches.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, i) => ActionChip(
                    avatar: const Icon(Icons.history_rounded, size: 16, color: AppColors.primary),
                    label: Text(searches[i]),
                    backgroundColor: Colors.white,
                    onPressed: () => context.push(
                      '/products?search=${Uri.encodeQueryComponent(searches[i])}&title=${Uri.encodeQueryComponent('"${searches[i]}"')}',
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Dark, high-contrast panel of the biggest real discounts in the catalogue.
class TopDealsRevealed extends ConsumerWidget {
  const TopDealsRevealed({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final top = ref.watch(_topDealsProvider);
    if (top.length < 3) return const SizedBox.shrink();
    final best = top.first.effectiveDiscountPercent;

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.only(bottom: 16),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0B1F44), Color(0xFF1B4DB3)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                const Icon(Icons.bolt_rounded, color: AppColors.accentYellow, size: 26),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Top Deals, Revealed',
                        style: context.text.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                      ),
                      Text(
                        'Up to $best% off right now',
                        style: context.text.bodySmall?.copyWith(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 196,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: top.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final p = top[i];
                return FadeSlideIn(
                  index: i,
                  offset: 0,
                  child: PressScale(
                    child: GestureDetector(
                      onTap: () => _openProduct(context, p, 'topdeal'),
                      child: Container(
                        width: 128,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6)),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(8),
                                    child: AppImage(p.image, fit: BoxFit.contain, cacheWidth: 200, backgroundColor: Colors.white),
                                  ),
                                  Positioned(
                                    left: 0,
                                    top: 8,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                      decoration: const BoxDecoration(
                                        color: AppColors.cta,
                                        borderRadius: BorderRadius.horizontal(right: Radius.circular(3)),
                                      ),
                                      child: Text(
                                        '${p.effectiveDiscountPercent}% OFF',
                                        style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: context.text.labelMedium),
                                  Text(
                                    formatPrice(p.sellingPrice),
                                    style: context.text.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Phone brands only, each shown with a real photo of one of its phones.
class PopularBrands extends ConsumerWidget {
  const PopularBrands({super.key});



  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(_popularMobileBrandsProvider);
    if (data == null) return const SizedBox.shrink();
    final (brands, byBrand, category) = data;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Popular Mobile Brands',
          subtitle: 'Shop phones by brand',
          onSeeAll: () => context.push(_listUrl(category: category, title: 'Mobiles')),
        ),
        Container(
          color: Colors.white,
          height: 124, // Decreased height
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 14),
            itemCount: brands.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final b = brands[i];
              final phones = byBrand[b]!;
              final maxOff = phones.fold<int>(0, (m, p) => p.effectiveDiscountPercent > m ? p.effectiveDiscountPercent : m);
              final minPrice = phones.map((p) => p.sellingPrice).reduce((a, b) => a < b ? a : b);
              final offer = maxOff >= 10 ? 'Up to $maxOff% off' : 'From ${formatPrice(minPrice)}';
              return FadeSlideIn(
                index: i,
                offset: 0,
                child: PressScale(
                  child: Material(
                    color: const Color(0xFFEFF4FF),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => context.push(_listUrl(category: category, brand: b, title: b)),
                      child: SizedBox(
                        width: 88, // Decreased width
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(6, 8, 6, 0),
                              child: Text(
                                b,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: context.text.labelLarge?.copyWith(fontWeight: FontWeight.w900, letterSpacing: 0.3),
                              ),
                            ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(8, 6, 8, 6),
                                child: AppImage(
                                  phones.firstWhere((p) => p.image.isNotEmpty, orElse: () => phones.first).image,
                                  fit: BoxFit.contain,
                                  cacheWidth: 180,
                                  backgroundColor: Colors.transparent,
                                  semanticLabel: '$b phone',
                                ),
                              ),
                            ),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(colors: [Color(0xFF2874F0), Color(0xFF6A3DE8)]),
                              ),
                              child: Text(
                                offer,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// Ranked mosaic of the best-reviewed products.
class PopularPicks extends ConsumerWidget {
  const PopularPicks({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shown = ref.watch(_popularPicksProvider);
    if (shown.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Popular Picks',
          subtitle: 'Loved by Collabo shoppers',
          onSeeAll: () => context.push(_listUrl(sort: 'rating', title: 'Popular Picks')),
        ),
        Container(
          color: const Color(0xFFFFF8E1),
          padding: const EdgeInsets.all(10),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 0.74,
            ),
            itemCount: shown.length,
            itemBuilder: (context, i) {
              final p = shown[i];
              return FadeSlideIn(
                index: i,
                child: PressScale(
                  child: GestureDetector(
                    onTap: () => _openProduct(context, p, 'pick'),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFFFE082)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(6),
                                  child: AppImage(p.image, fit: BoxFit.contain, cacheWidth: 180, backgroundColor: Colors.white),
                                ),
                                Positioned(
                                  left: 4,
                                  top: 4,
                                  child: Container(
                                    width: 22,
                                    height: 22,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: i == 0 ? const Color(0xFFFFB300) : const Color(0xFF424242),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      '${i + 1}',
                                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(6, 0, 6, 6),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: context.text.labelSmall),
                                Row(
                                  children: [
                                    Icon(Icons.star_rounded, size: 13, color: context.palette.rating),
                                    Text(
                                      p.rating.toStringAsFixed(1),
                                      style: context.text.labelSmall?.copyWith(fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// "Shop by budget": price-ceiling tiles that only appear when products fit.
class BudgetStore extends ConsumerWidget {
  const BudgetStore({super.key});

  static const _colors = [Color(0xFFE3F2FD), Color(0xFFE8F5E9), Color(0xFFFFF3E0), Color(0xFFF3E5F5)];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tiles = ref.watch(_budgetTilesProvider);
    if (tiles.length < 2) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Shop by Budget', subtitle: 'Great finds that fit your price'),
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(10, 0, 10, 14),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.55,
            ),
            itemCount: tiles.length,
            itemBuilder: (context, i) {
              final (max, items, img) = tiles[i];
              return FadeSlideIn(
                index: i,
                child: PressScale(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => context.push(_listUrl(max: max, title: 'Under ${formatPrice(max.toDouble())}')),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: _colors[i % _colors.length], borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Under', style: context.text.labelMedium?.copyWith(color: context.palette.mutedText)),
                                Text(
                                  formatPrice(max.toDouble()),
                                  style: context.text.titleLarge?.copyWith(fontWeight: FontWeight.w900),
                                ),
                                Text('${items.length} products', style: context.text.labelSmall),
                              ],
                            ),
                          ),
                          SizedBox(
                            width: 62,
                            child: AppImage(img, fit: BoxFit.contain, cacheWidth: 140),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// A category showcase: tinted panel with a 2x2 photo grid and "from" prices.
/// Kids and toys get a playful palette.
class CategorySpotlights extends ConsumerWidget {
  const CategorySpotlights({super.key, this.limit = 3});

  final int limit;

  static const _palettes = [
    (Color(0xFFEDE7F6), Color(0xFF5E35B1)),
    (Color(0xFFE0F2F1), Color(0xFF00796B)),
    (Color(0xFFFBE9E7), Color(0xFFD84315)),
    (Color(0xFFE3F2FD), Color(0xFF1565C0)),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = ref.watch(_categorySpotlightsProvider);
    if (groups.isEmpty) return const SizedBox.shrink();
    bool playful(String n) => RegExp('kid|toy|baby', caseSensitive: false).hasMatch(n);

    final shown = groups.take(limit).toList();
    return Column(
      children: [
        for (var i = 0; i < shown.length; i++)
          FadeSlideIn(
            child: _Spotlight(
              name: shown[i].$1,
              items: shown[i].$2.take(4).toList(),
              palette: playful(shown[i].$1) 
                  ? (const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFF472B6), Color(0xFFFB7185)]), Colors.white) 
                  : _palettes[i % _palettes.length],
              playful: playful(shown[i].$1),
            ),
          ),
      ],
    );
  }
}

class _Spotlight extends StatelessWidget {
  const _Spotlight({required this.name, required this.items, required this.palette, required this.playful});

  final String name;
  final List<Product> items;
  final (dynamic, Color) palette; // First element can be Color or Gradient
  final bool playful;

  @override
  Widget build(BuildContext context) {
    final (bg, accent) = palette;
    final radius = playful ? 22.0 : 4.0;
    return Container(
      margin: const EdgeInsets.only(top: 8),
      color: Colors.white,
      padding: const EdgeInsets.all(10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bg is Color ? bg : null,
          gradient: bg is Gradient ? bg : null,
          borderRadius: BorderRadius.circular(radius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    playful ? "$name Corner" : 'Best of $name',
                    style: context.text.titleMedium?.copyWith(color: accent, fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                ),
                TextButton(
                  onPressed: () => context.push(_listUrl(category: name, title: name)),
                  child: Text('See all', style: TextStyle(color: accent, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 0.95,
              ),
              itemCount: items.length,
              itemBuilder: (context, i) {
                final p = items[i];
                return PressScale(
                  child: GestureDetector(
                    onTap: () => _openProduct(context, p, 'spot'),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(playful ? 16 : 4),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(4),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(playful ? 14 : 2),
                                child: AppImage(p.image, fit: BoxFit.cover, cacheWidth: 220, backgroundColor: Colors.white),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
                            child: Text(
                              p.name, 
                              maxLines: 1, 
                              overflow: TextOverflow.ellipsis, 
                              style: context.text.labelMedium?.copyWith(fontWeight: FontWeight.w600),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class JewelleryShowcase extends ConsumerWidget {
  const JewelleryShowcase({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
    final items = pool.where((p) => (p.category.toLowerCase().contains('jewellery') || p.category.toLowerCase().contains('jewelry')) && p.image.isNotEmpty).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    return Container(
      color: const Color(0xFF1E1E1E), // Dark premium background
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      margin: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Timeless Pieces,',
            style: context.text.headlineSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 28),
          ),
          Text(
            'Everyday Elegance',
            style: context.text.headlineSmall?.copyWith(color: const Color(0xFFFFD700), fontWeight: FontWeight.w900, fontSize: 28),
          ),
          const SizedBox(height: 12),
          Text(
            'Earrings, jhumkas & more — handpicked designs to complete every look.',
            style: context.text.bodyMedium?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            onPressed: () => context.push(_listUrl(category: 'Jewellery', title: 'Jewellery')),
            icon: const Icon(Icons.diamond_outlined, color: Colors.black, size: 20),
            label: const Text('SHOP JEWELLERY', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFC107),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 290,
            child: GridView.builder(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: 110,
              ),
              itemCount: items.length,
              itemBuilder: (context, i) {
              final p = items[i];
              return GestureDetector(
                onTap: () => _openProduct(context, p, 'jewellery'),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                          child: AppImage(p.image, fit: BoxFit.cover, cacheWidth: 200),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(6.0),
                        child: Text(
                          p.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: context.text.labelSmall?.copyWith(fontWeight: FontWeight.bold, height: 1.1),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
      ),
    );
  }
}
