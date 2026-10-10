import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/product.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/state_views.dart';
import '../../shared/widgets/visual_search.dart';
import 'catalog_providers.dart';

class RecentSearches extends Notifier<List<String>> {
  static const _key = 'collabo.recent_searches';

  @override
  List<String> build() => ref.watch(sharedPreferencesProvider).getStringList(_key) ?? const [];

  void add(String term) {
    final t = term.trim();
    if (t.isEmpty) return;
    state = [t, ...state.where((s) => s.toLowerCase() != t.toLowerCase())].take(8).toList();
    ref.read(sharedPreferencesProvider).setStringList(_key, state);
  }

  void clear() {
    state = const [];
    ref.read(sharedPreferencesProvider).remove(_key);
  }
}

final recentSearchesProvider = NotifierProvider<RecentSearches, List<String>>(RecentSearches.new);

/// Debounced live suggestions; one request per pause in typing.
final _suggestionsProvider = FutureProvider.autoDispose.family<List<Product>, String>((ref, term) async {
  if (term.trim().length < 2) return const [];
  final page = await ref.watch(catalogRepositoryProvider).products(ProductQuery(search: term), pageSize: 8);
  return page.items;
});

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  String _term = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) setState(() => _term = value.trim());
    });
  }

  void _submit(String value) {
    final term = value.trim();
    if (term.isEmpty) return;
    ref.read(recentSearchesProvider.notifier).add(term);
    context.pushReplacement('/products?search=${Uri.encodeQueryComponent(term)}');
  }

  @override
  Widget build(BuildContext context) {
    final recent = ref.watch(recentSearchesProvider);
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Hero(
          tag: 'search-field',
          child: Material(
            type: MaterialType.transparency,
            child: TextField(
              controller: _controller,
              autofocus: true,
              textInputAction: TextInputAction.search,
              onChanged: _onChanged,
              onSubmitted: _submit,
              decoration: InputDecoration(
                hintText: 'Search for products, brands…',
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_controller.text.isNotEmpty)
                      IconButton(
                        tooltip: 'Clear',
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () {
                          _controller.clear();
                          setState(() => _term = '');
                        },
                      ),
                    IconButton(
                      tooltip: 'Search by Image',
                      icon: const Icon(Icons.camera_alt_outlined, color: AppColors.peacock, size: 20),
                      onPressed: () => VisualSearchHelper.startVisualSearch(context, ref),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Search',
            onPressed: () => _submit(_controller.text),
            icon: const Icon(Icons.search_rounded),
          ),
        ],
      ),
      body: _term.length >= 2 ? _Suggestions(term: _term, onSubmit: _submit) : _Idle(
        recent: recent,
        categories: categories,
        onPick: (t) {
          _controller.text = t;
          _submit(t);
        },
        onClear: () => ref.read(recentSearchesProvider.notifier).clear(),
      ),
    );
  }
}

class _Idle extends StatelessWidget {
  const _Idle({required this.recent, required this.categories, required this.onPick, required this.onClear});

  final List<String> recent;
  final List<Category> categories;
  final ValueChanged<String> onPick;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      children: [
        if (recent.isNotEmpty) ...[
          Row(
            children: [
              Expanded(child: Text('Recent searches', style: context.text.titleSmall)),
              TextButton(onPressed: onClear, child: const Text('Clear')),
            ],
          ),
          for (final r in recent)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.history_rounded),
              title: Text(r),
              trailing: const Icon(Icons.north_west_rounded, size: 18),
              onTap: () => onPick(r),
            ),
          const SizedBox(height: 16),
        ],
        if (categories.isNotEmpty) ...[
          Text('Popular categories', style: context.text.titleSmall),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final c in categories)
                ActionChip(
                  avatar: c.icon.isNotEmpty ? Text(c.icon) : null,
                  label: Text(c.name),
                  onPressed: () => context.pushReplacement(
                    '/products?category=${Uri.encodeQueryComponent(c.name)}&title=${Uri.encodeQueryComponent(c.name)}',
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _Suggestions extends ConsumerWidget {
  const _Suggestions({required this.term, required this.onSubmit});

  final String term;
  final ValueChanged<String> onSubmit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final results = ref.watch(_suggestionsProvider(term));
    return results.when(
      loading: () => const LinearProgressIndicator(minHeight: 2),
      error: (e, _) => ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(_suggestionsProvider(term))),
      data: (items) {
        if (items.isEmpty) {
          return EmptyState(
            compact: true,
            icon: Icons.search_off_rounded,
            title: 'No matches for "$term"',
            message: 'Check the spelling or try a more general term.',
          );
        }
        return ListView.separated(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          itemCount: items.length + 1,
          separatorBuilder: (_, _) => const Divider(indent: 76),
          itemBuilder: (context, i) {
            if (i == items.length) {
              return ListTile(
                leading: const Icon(Icons.search_rounded),
                title: Text('See all results for "$term"'),
                onTap: () => onSubmit(term),
              );
            }
            final p = items[i];
            return ListTile(
              leading: AppImage(
                p.image,
                width: 48,
                height: 48,
                fit: BoxFit.contain,
                cacheWidth: 48,
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
              title: Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis),
              subtitle: p.category.isEmpty
                  ? null
                  : Text(p.category, style: TextStyle(color: context.palette.mutedText)),
              trailing: Text(formatPrice(p.sellingPrice), style: context.text.titleSmall),
              onTap: () => context.push('/product/${p.id}'),
            );
          },
        );
      },
    );
  }
}
