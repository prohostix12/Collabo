import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/json.dart';
import '../models/paginated.dart';
import '../models/product.dart';
import '../models/store_settings.dart';

class PincodeResult {
  const PincodeResult({required this.available, required this.message});
  final bool available;
  final String message;
}

class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  static const pageSize = 20;

  Future<Paginated<Product>> products(ProductQuery query, {int page = 1, int pageSize = pageSize}) async {
    final data = await _api.get('ecommerce/products/', query: {
      ...query.toQuery(),
      'page': page,
      'page_size': pageSize,
    });
    return Paginated.fromJson(data, Product.fromJson);
  }

  Future<Product> product(int id) async =>
      Product.fromJson(asMap(await _api.get('ecommerce/products/$id/')));

  /// Resolves admin-curated id lists (deals, trending). Ids that no longer
  /// exist or aren't approved come back 404 and are skipped.
  Future<List<Product>> productsByIds(List<int> ids) async {
    final results = await Future.wait(ids.map((id) async {
      try {
        return await product(id);
      } on ApiException catch (e) {
        if (e.isNotFound) return null;
        rethrow;
      }
    }));
    return results.whereType<Product>().where((p) => p.name.isNotEmpty).toList();
  }

  Future<List<Category>> categories() async {
    final data = await _api.get('ecommerce/categories/', query: {'page_size': 100});
    return Paginated.fromJson(data, Category.fromJson).items;
  }

  Future<List<Brand>> brands() async {
    final data = await _api.get('ecommerce/brands/', query: {'page_size': 500});
    return Paginated.fromJson(data, Brand.fromJson)
        .items
        .where((b) => b.name.trim().isNotEmpty)
        .toList();
  }

  Future<StoreSettings> storeSettings() async =>
      StoreSettings.fromJson(asMap(await _api.get('ecommerce/store-settings/')));

  Future<Paginated<CustomerReview>> reviews(int productId, {int page = 1}) async {
    final data = await _api.get('ecommerce/customer-reviews/', query: {
      'product': productId,
      'page': page,
      'page_size': 10,
    });
    return Paginated.fromJson(data, CustomerReview.fromJson);
  }

  /// Backend accepts reviews for products the user bought and paid for, with optional image/video media.
  Future<void> addReview({required int productId, required int rating, required String comment, String? image}) =>
      _api.post('ecommerce/customer-reviews/', data: {
        'product': productId,
        'rating': rating,
        'comment': comment.trim(),
        if (image != null && image.isNotEmpty) 'image': image,
      });

  Future<PincodeResult> checkPincode(String pincode) async {
    try {
      final data = asMap(await _api.get('ecommerce/check-pincode/', query: {'pincode': pincode}));
      return PincodeResult(
        available: asBool(data['available']),
        message: asString(data['message']),
      );
    } on ApiException catch (e) {
      if (e.statusCode == 400) return PincodeResult(available: false, message: e.message);
      rethrow;
    }
  }
}
