import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/address.dart';
import '../models/cart.dart';
import '../models/paginated.dart';
import '../models/product.dart';
import '../models/wallet.dart';

class CartRepository {
  CartRepository(this._api);
  final ApiClient _api;

  Future<Cart> fetch() async => Cart.fromJson(await _api.get('ecommerce/cart/'));

  Future<Cart> add(int productId, {int quantity = 1}) async => Cart.fromJson(
        await _api.post('ecommerce/cart/add/', data: {'product': productId, 'quantity': quantity}),
      );

  Future<Cart> updateQuantity(int itemId, int quantity) async => Cart.fromJson(
        await _api.patch('ecommerce/cart/items/$itemId/', data: {'quantity': quantity}),
      );

  Future<Cart> remove(int itemId) async =>
      Cart.fromJson(await _api.delete('ecommerce/cart/items/$itemId/'));
}

class WishlistRepository {
  WishlistRepository(this._api);
  final ApiClient _api;

  Future<Set<int>> ids() async {
    final data = await _api.get('ecommerce/wishlist/ids/');
    return asIntList(data).toSet();
  }

  Future<List<Product>> products() async {
    final data = await _api.get('ecommerce/wishlist/', query: {'page_size': 200});
    return Paginated.fromJson(data, (j) => Product.fromJson(asMap(j['product_details'])))
        .items
        .where((p) => p.id != 0)
        .toList();
  }

  /// The endpoint toggles: returns true when the product was added.
  Future<bool> toggle(int productId) async {
    final data = asMap(await _api.post('ecommerce/wishlist/', data: {'product': productId}));
    return asString(data['status']) == 'added';
  }
}

class AddressRepository {
  AddressRepository(this._api);
  final ApiClient _api;

  Future<List<Address>> list() async {
    final data = await _api.get('ecommerce/addresses/', query: {'page_size': 100});
    return Paginated.fromJson(data, Address.fromJson).items;
  }

  Future<Address> create(Address address) async =>
      Address.fromJson(asMap(await _api.post('ecommerce/addresses/', data: address.toJson())));

  Future<Address> update(int id, Address address) async =>
      Address.fromJson(asMap(await _api.put('ecommerce/addresses/$id/', data: address.toJson())));

  Future<void> delete(int id) => _api.delete('ecommerce/addresses/$id/');
}

class WalletRepository {
  WalletRepository(this._api);
  final ApiClient _api;

  Future<Wallet> fetch() async => Wallet.fromJson(await _api.get('ecommerce/wallet/'));

  Future<void> requestWithdrawal(double amount, String name, String account, String ifsc) async {
    await _api.post('ecommerce/wallet/withdraw/', data: {
      'amount': amount,
      'account_holder_name': name,
      'account_number': account,
      'ifsc_code': ifsc,
    });
  }
}
