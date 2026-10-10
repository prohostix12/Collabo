import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/category_icons.dart';
import '../../core/utils/category_images.dart';
import '../../data/models/product.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/motion.dart';
import '../../shared/widgets/product_widgets.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import 'catalog_providers.dart';

/// Flipkart-style categories: a rail of category thumbnails on the left and
/// the selected category's live products on the right.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  String? _selected;

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider);
    final covers = ref.watch(categoryCoversProvider).value ?? const <String, String>{};
    final storeImages = ref.watch(storeSettingsProvider).value?.categoryImages ?? const <String, String>{};

    String? imageFor(String name) => storeImages[name] ?? CategoryImages.of(name) ?? covers[name];

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Categories'),
        actions: [
          IconButton(
            tooltip: 'Search',
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search_rounded),
          ),
        ],
      ),
      body: categories.when(
        loading: () => const _RailSkeleton(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(categoriesProvider)),
        data: (all) {
          if (all.isEmpty) {
            return const EmptyState(icon: Icons.category_outlined, title: 'No categories yet');
          }
          final selected = all.any((c) => c.name == _selected) ? _selected! : all.first.name;
          return Row(
            children: [
              SizedBox(
                width: 92,
                child: ColoredBox(
                  color: const Color(0xFFF1F3F6),
                  child: ListView.builder(
                    itemCount: all.length,
                    itemBuilder: (context, i) {
                      final c = all[i];
                      return _RailItem(
                        name: c.name,
                        image: imageFor(c.name),
                        selected: c.name == selected,
                        onTap: () => setState(() => _selected = c.name),
                      );
                    },
                  ),
                ),
              ),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: _CategoryPane(key: ValueKey(selected), name: selected),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _RailItem extends StatelessWidget {
  const _RailItem({required this.name, required this.image, required this.selected, required this.onTap});

  final String name;
  final String? image;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasImage = image != null && image!.trim().isNotEmpty;
    return Semantics(
      button: true,
      selected: selected,
      label: name,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            border: Border(
              left: BorderSide(color: selected ? AppColors.primary : Colors.transparent, width: 3),
            ),
          ),
          child: Column(
            children: [
              Container(
                width: 52,
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFEAF1FE),
                  border: selected ? Border.all(color: AppColors.primary, width: 1.5) : null,
                ),
                clipBehavior: Clip.antiAlias,
                child: hasImage
                    ? AppImage(image!, width: 52, height: 52, fit: BoxFit.cover, cacheWidth: 120)
                    : Icon(CategoryIcons.of(name), size: 22, color: AppColors.primary),
              ),
              const SizedBox(height: 6),
              Text(
                name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: context.text.labelSmall?.copyWith(
                  fontSize: 11,
                  height: 1.15,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? AppColors.primary : const Color(0xFF212121),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryPane extends ConsumerWidget {
  const _CategoryPane({super.key, required this.name});
  final String name;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ProductQuery(category: name);
    final products = ref.watch(productShelfProvider(query));
    final listUrl = '/products?category=${Uri.encodeQueryComponent(name)}&title=${Uri.encodeQueryComponent(name)}';

    return RefreshIndicator(
      onRefresh: () => ref.refresh(productShelfProvider(query).future),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(14, 14, 8, 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.titleMedium?.copyWith(fontSize: 17),
                    ),
                  ),
                  TextButton(onPressed: () => context.push(listUrl), child: const Text('View all')),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 6)),
          ...products.when(
            loading: () => [const SliverProductGridSkeleton(count: 4)],
            error: (e, _) => [
              SliverFillRemaining(
                hasScrollBody: false,
                child: ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(productShelfProvider(query))),
              ),
            ],
            data: (list) {
              if (list.isEmpty) {
                return [
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(icon: Icons.inventory_2_outlined, title: 'No products in this category yet'),
                  ),
                ];
              }
              return [
                SliverProductGrid(products: list, heroPrefix: 'cat'),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: FadeSlideIn(
                      child: FilledButton(
                        onPressed: () => context.push(listUrl),
                        child: Text('See all in $name'),
                      ),
                    ),
                  ),
                ),
              ];
            },
          ),
        ],
      ),
    );
  }
}

class _RailSkeleton extends StatelessWidget {
  const _RailSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Row(
        children: [
          SizedBox(
            width: 92,
            child: ListView.builder(
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 8,
              itemBuilder: (_, _) => const Padding(
                padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                child: Column(children: [Skeleton(width: 52, height: 52, radius: 26), SizedBox(height: 6), Skeleton(width: 48, height: 9)]),
              ),
            ),
          ),
          const Expanded(child: SizedBox.shrink()),
        ],
      ),
    );
  }
}
