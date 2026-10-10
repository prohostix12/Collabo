import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/category_images.dart';
import '../../data/models/product.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/motion.dart';
import '../catalog/catalog_providers.dart';

/// One entry of the sticky feed tabs. [key] is the category name, or null for
/// the "For You" tab.
class FeedTab {
  const FeedTab({required this.key, required this.label, this.image, this.asset});
  final String? key;
  final String label;
  final String? image;
  final String? asset;
}

/// Tabs built from the store's real categories, with their photos.
final feedTabsProvider = Provider<List<FeedTab>>((ref) {
  final cats = ref.watch(categoriesProvider).value ?? const <Category>[];
  final covers = ref.watch(categoryCoversProvider).value ?? const <String, String>{};
  final stored = ref.watch(storeSettingsProvider).value?.categoryImages ?? const <String, String>{};
  final pool = ref.watch(productPoolProvider).value ?? const <Product>[];

  return [
    const FeedTab(key: null, label: 'For You', asset: 'assets/images/ecommerce_products_collage.png'),
    ...cats.map((c) {
      final catProducts = pool.where((p) => p.category == c.name && p.image.isNotEmpty);
      final productImg = catProducts.isNotEmpty ? catProducts.first.image : null;
      return FeedTab(
        key: c.name, 
        label: c.name, 
        image: productImg ?? stored[c.name] ?? CategoryImages.of(c.name) ?? covers[c.name]
      );
    }),
  ];
});

/// Pinned strip of category photos above the product feed.
class FeedTabsDelegate extends SliverPersistentHeaderDelegate {
  FeedTabsDelegate({required this.tabs, required this.selected, required this.onSelect});

  final List<FeedTab> tabs;
  final String? selected;
  final ValueChanged<String?> onSelect;

  static const _height = 68.0;

  @override
  double get minExtent => _height;
  @override
  double get maxExtent => _height;

  @override
  bool shouldRebuild(FeedTabsDelegate old) =>
      old.selected != selected || old.tabs.length != tabs.length || old.tabs != tabs;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Material(
      color: Colors.white,
      elevation: overlapsContent ? 2 : 0,
      shadowColor: Colors.black26,
      child: Container(
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE6E6E6)))),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          itemCount: tabs.length,
          separatorBuilder: (_, _) => const SizedBox(width: 6),
          itemBuilder: (context, i) {
            final t = tabs[i];
            final on = t.key == selected;
            return Semantics(
              button: true,
              selected: on,
              label: t.label,
              excludeSemantics: true,
              child: InkWell(
                onTap: () => onSelect(t.key),
                child: SizedBox(
                  width: 66,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const SizedBox(height: 3),
                      AnimatedScale(
                        scale: on ? 1.05 : 1,
                        duration: const Duration(milliseconds: 180),
                        child: Container(
                          width: 44,
                          height: 38,
                          decoration: BoxDecoration(
                            color: on ? AppTheme.peacockBlue.withOpacity(0.12) : const Color(0xFFF0F3F7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: t.asset != null
                              ? Image.asset(t.asset!, fit: BoxFit.cover)
                              : (t.image != null && t.image!.isNotEmpty
                                  ? AppImage(t.image!, fit: BoxFit.cover, cacheWidth: 100)
                                  : Center(
                                      child: Text(
                                        t.label.characters.first.toUpperCase(),
                                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.peacockBlue),
                                      ),
                                    )),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        t.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: on ? FontWeight.w800 : FontWeight.w500,
                          color: on ? AppTheme.peacockBlue : const Color(0xFF424242),
                        ),
                      ),
                      const SizedBox(height: 2),
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        height: 2.5,
                        width: on ? 66 : 0,
                        decoration: BoxDecoration(color: AppTheme.peacockBlue, borderRadius: BorderRadius.circular(2)),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Second row of cards (after the brand row): top categories with their photo
/// and the best discount currently available in each.
class TopCategoryCards extends ConsumerWidget {
  const TopCategoryCards({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tabs = ref.watch(feedTabsProvider).where((t) => t.key != null && (t.image ?? '').isNotEmpty).toList();
    final pool = ref.watch(productPoolProvider).value ?? const <Product>[];
    if (tabs.length < 3) return const SizedBox.shrink();

    int bestOff(String cat) => pool
        .where((p) => p.category == cat)
        .fold<int>(0, (m, p) => p.effectiveDiscountPercent > m ? p.effectiveDiscountPercent : m);
    final shown = tabs.take(10).toList();

    return Container(
      margin: const EdgeInsets.only(top: 8),
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 10),
            child: Text('Top Categories', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          ),
          SizedBox(
            height: 148,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: shown.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final t = shown[i];
                final off = bestOff(t.key!);
                return FadeSlideIn(
                  index: i,
                  offset: 0,
                  child: PressScale(
                    child: GestureDetector(
                      onTap: () => context.push(
                        '/products?category=${Uri.encodeQueryComponent(t.key!)}&title=${Uri.encodeQueryComponent(t.label)}',
                      ),
                      child: Container(
                        width: 112,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          gradient: const LinearGradient(
                            colors: [Color(0xFFDCE9FF), Color(0xFFF4F8FF)],
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                          ),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          children: [
                            const SizedBox(height: 8),
                            Text(
                              t.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0.3),
                            ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.all(8),
                                child: AppImage(t.image!, fit: BoxFit.contain, cacheWidth: 200),
                              ),
                            ),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(colors: [Color(0xFF2874F0), Color(0xFF6A3DE8)]),
                              ),
                              child: Text(
                                off >= 10 ? 'Up to $off% off' : 'Shop now',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
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
