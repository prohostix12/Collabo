import '../../core/utils/json.dart';

/// DRF PageNumberPagination envelope: {count, next, previous, results}.
class Paginated<T> {
  const Paginated({required this.items, required this.count, required this.hasMore});

  factory Paginated.fromJson(dynamic json, T Function(Map<String, dynamic>) parse) {
    if (json is List) {
      final items = asMapList(json).map(parse).toList();
      return Paginated(items: items, count: items.length, hasMore: false);
    }
    final map = asMap(json);
    final items = asMapList(map['results']).map(parse).toList();
    return Paginated(
      items: items,
      count: asInt(map['count'], items.length),
      hasMore: map['next'] != null,
    );
  }

  final List<T> items;
  final int count;
  final bool hasMore;
}

/// Accumulated state for an infinitely scrolling list.
class PagedData<T> {
  const PagedData({
    required this.items,
    required this.page,
    required this.hasMore,
    required this.total,
    this.loadingMore = false,
    this.loadMoreError,
  });

  final List<T> items;
  final int page;
  final bool hasMore;
  final int total;
  final bool loadingMore;
  final Object? loadMoreError;

  bool get isEmpty => items.isEmpty;

  PagedData<T> copyWith({
    List<T>? items,
    int? page,
    bool? hasMore,
    int? total,
    bool? loadingMore,
    Object? loadMoreError,
    bool clearError = false,
  }) {
    return PagedData(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      total: total ?? this.total,
      loadingMore: loadingMore ?? this.loadingMore,
      loadMoreError: clearError ? null : (loadMoreError ?? this.loadMoreError),
    );
  }
}
