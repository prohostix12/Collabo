import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/paginated.dart';

/// Infinite-scroll base: `build` loads page 1, [loadMore] appends the next
/// page while keeping already-loaded items visible on failure.
abstract class PagedNotifier<T> extends AsyncNotifier<PagedData<T>> {
  Future<Paginated<T>> fetchPage(int page);

  @override
  Future<PagedData<T>> build() async {
    final first = await fetchPage(1);
    return PagedData(items: first.items, page: 1, hasMore: first.hasMore, total: first.count);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || current.loadingMore || !current.hasMore || state.isLoading) return;
    state = AsyncData(current.copyWith(loadingMore: true, clearError: true));
    try {
      final next = await fetchPage(current.page + 1);
      if (!ref.mounted) return;
      state = AsyncData(current.copyWith(
        items: [...current.items, ...next.items],
        page: current.page + 1,
        hasMore: next.hasMore,
        total: next.count,
        loadingMore: false,
      ));
    } catch (e) {
      if (!ref.mounted) return;
      state = AsyncData(current.copyWith(loadingMore: false, loadMoreError: e));
    }
  }
}
