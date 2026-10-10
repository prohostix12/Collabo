import '../../core/utils/json.dart';
import 'product.dart';

class CartItem {
  const CartItem({required this.id, required this.product, required this.quantity});

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
        id: asInt(j['id']),
        product: Product.fromJson(asMap(j['product_details'])),
        quantity: asInt(j['quantity'], 1),
      );

  final int id;
  final Product product;
  final int quantity;

  double get lineTotal => product.sellingPrice * quantity;
  double get lineMrp => product.price * quantity;

  CartItem copyWith({int? quantity}) =>
      CartItem(id: id, product: product, quantity: quantity ?? this.quantity);
}

class Cart {
  const Cart({required this.items});

  factory Cart.fromJson(dynamic json) =>
      Cart(items: asMapList(asMap(json)['items']).map(CartItem.fromJson).toList());

  static const empty = Cart(items: []);

  final List<CartItem> items;

  int get totalQuantity => items.fold(0, (sum, i) => sum + i.quantity);
  bool get isEmpty => items.isEmpty;

  CartItem? itemForProduct(int productId) {
    for (final item in items) {
      if (item.product.id == productId) return item;
    }
    return null;
  }
}
