import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/product.dart';
import '../../shared/widgets/product_widgets.dart';
import '../../shared/widgets/state_views.dart';
import 'catalog_providers.dart';

class ProductListScreen extends ConsumerStatefulWidget {
  const ProductListScreen({super.key, this.title, this.category, this.search, this.sort, this.brand, this.maxPrice});

  final String? title;
  final String? category;
  final String? search;
  final String? sort;
  final String? brand;
  final int? maxPrice;

  @override
  ConsumerState<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends ConsumerState<ProductListScreen> {
  late ProductQuery _query = ProductQuery(
    category: widget.category,
    search: widget.search,
    brand: widget.brand,
    maxPrice: widget.maxPrice,
    sort: switch (widget.sort) {
      'newest' => ProductSort.newest,
      'rating' => ProductSort.rating,
      'price' => ProductSort.priceLow,
      _ => ProductSort.relevance,
    },
  );
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 500) {
        ref.read(productListProvider(_query).notifier).loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _update(ProductQuery q) {
    if (q == _query) return;
    setState(() => _query = q);
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<void> _openSort() async {
    final picked = await showModalBottomSheet<ProductSort>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Text('Sort by', style: context.text.titleMedium),
            ),
            RadioGroup<ProductSort>(
              groupValue: _query.sort,
              onChanged: (v) => Navigator.pop(context, v),
              child: Column(
                children: [
                  for (final s in ProductSort.values)
                    RadioListTile<ProductSort>(value: s, title: Text(s.label)),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (picked != null) _update(_query.copyWith(sort: picked));
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<ProductQuery>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => FilterSheet(initial: _query),
    );
    if (result != null) _update(result);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(productListProvider(_query));
    final title = widget.title ?? (widget.search != null ? '"${widget.search}"' : (widget.brand ?? 'Products'));

    return Scaffold(
      bottomNavigationBar: _SortFilterBar(
        query: _query,
        onSort: _openSort,
        onFilter: _openFilters,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(productListProvider(_query).future),
        edgeOffset: 100,
        child: CustomScrollView(
          controller: _scroll,
          slivers: [
            SliverAppBar(
              pinned: true,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  if (state.value != null)
                    Text(
                      '${state.value!.total} items',
                      style: context.text.labelSmall?.copyWith(color: context.palette.mutedText),
                    ),
                ],
              ),
              actions: [
                IconButton(
                  tooltip: 'Search',
                  onPressed: () => context.push('/search'),
                  icon: const Icon(Icons.search_rounded),
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(48),
                child: _FilterBar(
                  query: _query,
                  onSort: _openSort,
                  onFilter: _openFilters,
                  onClear: () => _update(_query.clearFilters()),
                  onToggleStock: () => _update(_query.copyWith(inStockOnly: !_query.inStockOnly)),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 8)),
            ...state.when(
              loading: () => [const SliverProductGridSkeleton(count: 8)],
              error: (e, _) => [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorView(error: e, onRetry: () => ref.invalidate(productListProvider(_query))),
                ),
              ],
              data: (page) {
                if (page.isEmpty) {
                  return [
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyState(
                        icon: Icons.search_off_rounded,
                        title: 'No products found',
                        message: _query.activeFilterCount > 0
                            ? 'Try removing some filters to see more results.'
                            : 'Try a different search or browse categories.',
                        actionLabel: _query.activeFilterCount > 0 ? 'Clear filters' : 'Browse categories',
                        onAction: _query.activeFilterCount > 0
                            ? () => _update(_query.clearFilters())
                            : () => context.go('/categories'),
                      ),
                    ),
                  ];
                }
                return [
                  SliverProductGrid(products: page.items, heroPrefix: 'list'),
                  SliverToBoxAdapter(
                    child: LoadMoreFooter(
                      loading: page.loadingMore,
                      error: page.loadMoreError,
                      onRetry: () => ref.read(productListProvider(_query).notifier).loadMore(),
                    ),
                  ),
                ];
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.query,
    required this.onSort,
    required this.onFilter,
    required this.onClear,
    required this.onToggleStock,
  });

  final ProductQuery query;
  final VoidCallback onSort;
  final VoidCallback onFilter;
  final VoidCallback onClear;
  final VoidCallback onToggleStock;

  @override
  Widget build(BuildContext context) {
    final count = query.activeFilterCount;
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
        children: [
          FilterChip(
            label: const Text('In stock'),
            selected: query.inStockOnly,
            showCheckmark: false,
            selectedColor: const Color(0xFFE3EDFE),
            side: BorderSide(color: query.inStockOnly ? AppColors.primary : const Color(0xFFD0D0D0)),
            onSelected: (_) => onToggleStock(),
          ),
          if (count > 0) ...[
            const SizedBox(width: 8),
            ActionChip(
              avatar: const Icon(Icons.close_rounded, size: 16),
              label: Text('Clear ($count)'),
              onPressed: onClear,
            ),
          ],
        ],
      ),
    );
  }
}

/// Flipkart's sticky "Sort | Filter" bar at the bottom of the results.
class _SortFilterBar extends StatelessWidget {
  const _SortFilterBar({required this.query, required this.onSort, required this.onFilter});

  final ProductQuery query;
  final VoidCallback onSort;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
    final count = query.activeFilterCount;
    Widget half(IconData icon, String label, String? sub, VoidCallback onTap) => Expanded(
          child: InkWell(
            onTap: onTap,
            child: SizedBox(
              height: 52,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 20, color: const Color(0xFF212121)),
                  const SizedBox(width: 8),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: context.text.titleSmall),
                      if (sub != null)
                        Text(sub, style: context.text.labelSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
    return Material(
      color: Colors.white,
      elevation: 12,
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            half(Icons.swap_vert_rounded, 'Sort', query.sort == ProductSort.relevance ? null : query.sort.label, onSort),
            Container(width: 1, height: 28, color: const Color(0xFFE0E0E0)),
            half(Icons.filter_alt_outlined, 'Filter', count > 0 ? '$count applied' : null, onFilter),
          ],
        ),
      ),
    );
  }
}

class FilterSheet extends ConsumerStatefulWidget {
  const FilterSheet({super.key, required this.initial});
  final ProductQuery initial;

  @override
  ConsumerState<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<FilterSheet> {
  static const _priceBands = <(String, int?, int?)>[
    ('Under ₹500', null, 500),
    ('₹500 – ₹1,000', 500, 1000),
    ('₹1,000 – ₹5,000', 1000, 5000),
    ('₹5,000 – ₹20,000', 5000, 20000),
    ('Above ₹20,000', 20000, null),
  ];

  late String? _category = widget.initial.category;
  late String? _brand = widget.initial.brand;
  late int? _min = widget.initial.minPrice;
  late int? _max = widget.initial.maxPrice;
  late int? _rating = widget.initial.minRating;
  late bool _inStock = widget.initial.inStockOnly;
  String _section = 'Category';

  void _reset() => setState(() {
        _brand = null;
        _min = null;
        _max = null;
        _rating = null;
        _inStock = false;
        if (widget.initial.category == null) _category = null;
      });

  Widget _option({required String label, required bool selected, required VoidCallback onTap, Widget? leading}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: Row(
          children: [
            Checkbox(
              value: selected,
              visualDensity: VisualDensity.compact,
              activeColor: AppColors.primary,
              onChanged: (_) => onTap(),
            ),
            if (leading != null) ...[leading, const SizedBox(width: 4)],
            Expanded(child: Text(label, style: context.text.bodyMedium)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];
    final brands = ref.watch(brandsProvider).value ?? const <Brand>[];

    final sections = <String, bool>{
      if (categories.isNotEmpty) 'Category': _category != null,
      'Price': _min != null || _max != null,
      'Customer rating': _rating != null,
      if (brands.isNotEmpty) 'Brand': _brand != null,
      'Availability': _inStock,
    };
    final active = sections.containsKey(_section) ? _section : sections.keys.first;

    Widget content() {
      switch (active) {
        case 'Category':
          return ListView(children: [
            for (final c in categories)
              _option(
                label: c.name,
                selected: _category == c.name,
                onTap: () => setState(() => _category = _category == c.name ? null : c.name),
              ),
          ]);
        case 'Price':
          return ListView(children: [
            for (final band in _priceBands)
              _option(
                label: band.$1,
                selected: _min == band.$2 && _max == band.$3,
                onTap: () => setState(() {
                  final on = _min == band.$2 && _max == band.$3;
                  _min = on ? null : band.$2;
                  _max = on ? null : band.$3;
                }),
              ),
          ]);
        case 'Customer rating':
          return ListView(children: [
            for (final r in [4, 3, 2])
              _option(
                label: '$r★ & above',
                selected: _rating == r,
                onTap: () => setState(() => _rating = _rating == r ? null : r),
              ),
          ]);
        case 'Brand':
          return ListView(children: [
            for (final b in brands.take(60))
              _option(
                label: b.name,
                selected: _brand == b.name,
                onTap: () => setState(() => _brand = _brand == b.name ? null : b.name),
              ),
          ]);
        default:
          return ListView(children: [
            _option(
              label: 'Exclude out of stock',
              selected: _inStock,
              onTap: () => setState(() => _inStock = !_inStock),
            ),
          ]);
      }
    }

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.88,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 8, 8),
            child: Row(
              children: [
                Expanded(child: Text('Filters', style: context.text.titleLarge)),
                TextButton(onPressed: _reset, child: const Text('Clear all')),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 128,
                  color: const Color(0xFFF1F3F6),
                  child: ListView(
                    children: [
                      for (final e in sections.entries)
                        InkWell(
                          onTap: () => setState(() => _section = e.key),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                            decoration: BoxDecoration(
                              color: e.key == active ? Colors.white : Colors.transparent,
                              border: Border(
                                left: BorderSide(
                                  color: e.key == active ? AppColors.primary : Colors.transparent,
                                  width: 3,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    e.key,
                                    style: context.text.bodyMedium?.copyWith(
                                      fontWeight: e.key == active ? FontWeight.w700 : FontWeight.w500,
                                    ),
                                  ),
                                ),
                                if (e.value)
                                  const CircleAvatar(radius: 4, backgroundColor: AppColors.primary),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    child: KeyedSubtree(key: ValueKey(active), child: content()),
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        Navigator.pop(
                          context,
                          ProductQuery(
                            search: widget.initial.search,
                            category: _category,
                            brand: _brand,
                            minPrice: _min,
                            maxPrice: _max,
                            minRating: _rating,
                            inStockOnly: _inStock,
                            sort: widget.initial.sort,
                          ),
                        );
                      },
                      child: const Text('Apply'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
