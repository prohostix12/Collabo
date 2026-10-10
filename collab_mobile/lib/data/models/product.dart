import '../../core/utils/json.dart';

class ProductSpec {
  const ProductSpec(this.name, this.value);
  final String name;
  final String value;
}

class ProductQa {
  const ProductQa(this.question, this.answer);
  final String question;
  final String answer;
}

class ProductColor {
  const ProductColor(this.name, this.image);
  final String name;
  final String image;
}

class Vendor {
  const Vendor({
    required this.id,
    required this.name,
    required this.returnPolicy,
    required this.deliveryTime,
    required this.deliveryCharge,
  });

  factory Vendor.fromJson(Map<String, dynamic> j) => Vendor(
        id: asInt(j['id']),
        name: asString(j['name']),
        returnPolicy: asString(j['return_policy']),
        deliveryTime: asString(j['delivery_time']),
        deliveryCharge: asDouble(j['delivery_charge']),
      );

  final int id;
  final String name;
  final String returnPolicy;
  final String deliveryTime;
  final double deliveryCharge;
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.brand,
    required this.price,
    required this.discountPrice,
    required this.discountPercent,
    required this.rating,
    required this.reviewsCount,
    required this.image,
    required this.images,
    required this.colors,
    required this.description,
    required this.stock,
    required this.delivery,
    required this.specifications,
    required this.highlights,
    required this.offers,
    required this.sellerInfo,
    required this.qa,
    required this.shippingCharge,
    required this.returnPolicy,
    required this.sellerId,
    required this.sellerUsername,
    required this.vendor,
  });

  factory Product.fromJson(Map<String, dynamic> j) {
    final vendorJson = j['vendor_details'];
    return Product(
      id: asInt(j['id']),
      name: asString(j['name']).trim(),
      category: asString(j['category']),
      brand: asString(j['brand']),
      price: asDouble(j['price']),
      discountPrice: asDoubleOrNull(j['discount_price']),
      discountPercent: asInt(j['discount_percent']),
      rating: asDouble(j['rating']),
      reviewsCount: asInt(j['reviews_count']),
      image: asString(j['image']),
      images: asStringList(j['images']),
      colors: asMapList(j['colors'])
          .map((c) => ProductColor(asString(c['name']), asString(c['image'])))
          .where((c) => c.name.isNotEmpty)
          .toList(),
      description: asString(j['description']),
      stock: asInt(j['stock']),
      delivery: asString(j['delivery']),
      specifications: asMapList(j['specifications'])
          .map((s) => ProductSpec(asString(s['name']), asString(s['value'])))
          .where((s) => s.name.isNotEmpty)
          .toList(),
      highlights: asStringList(j['highlights']),
      offers: asStringList(j['offers']),
      sellerInfo: asString(j['seller_info']),
      qa: asMapList(j['qa_section'])
          .map((q) => ProductQa(asString(q['q'] ?? q['question']), asString(q['a'] ?? q['answer'])))
          .where((q) => q.question.isNotEmpty)
          .toList(),
      shippingCharge: asDouble(j['product_shipping_charge']),
      returnPolicy: asString(j['return_policy']),
      sellerId: asIntOrNull(j['seller']),
      sellerUsername: asString(j['seller_username']),
      vendor: vendorJson is Map ? Vendor.fromJson(Map<String, dynamic>.from(vendorJson)) : null,
    );
  }

  final int id;
  final String name;
  final String category;
  final String brand;
  final double price;
  final double? discountPrice;
  final int discountPercent;
  final double rating;
  final int reviewsCount;
  final String image;
  final List<String> images;
  final List<ProductColor> colors;
  final String description;
  final int stock;
  final String delivery;
  final List<ProductSpec> specifications;
  final List<String> highlights;
  final List<String> offers;
  final String sellerInfo;
  final List<ProductQa> qa;
  final double shippingCharge;
  final String returnPolicy;
  final int? sellerId;
  final String sellerUsername;
  final Vendor? vendor;

  /// The price the backend charges at checkout (`discount_price`).
  double get sellingPrice => discountPrice ?? price;

  bool get hasDiscount => discountPrice != null && discountPrice! < price;

  int get effectiveDiscountPercent {
    if (discountPercent > 0) return discountPercent;
    if (!hasDiscount || price <= 0) return 0;
    return ((1 - sellingPrice / price) * 100).round();
  }

  bool get inStock => stock > 0;
  bool get lowStock => stock > 0 && stock <= 5;

  String get displayReturnPolicy =>
      returnPolicy.isNotEmpty ? returnPolicy : (vendor?.returnPolicy ?? '');

  String get displayDelivery =>
      delivery.isNotEmpty ? delivery : (vendor?.deliveryTime ?? '');

  List<String> get gallery {
    final list = <String>[];
    if (image.isNotEmpty) list.add(image);
    for (final img in images) {
      if (img.isNotEmpty && !list.contains(img)) list.add(img);
    }
    return list;
  }
}

class Category {
  const Category({required this.id, required this.name, required this.icon});

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: asInt(j['id']),
        name: asString(j['name']),
        icon: asString(j['icon']),
      );

  final int id;
  final String name;
  final String icon;
}

class Brand {
  const Brand({required this.id, required this.name});

  factory Brand.fromJson(Map<String, dynamic> j) =>
      Brand(id: asInt(j['id']), name: asString(j['name']));

  final int id;
  final String name;
}

class CustomerReview {
  const CustomerReview({
    required this.id,
    required this.productId,
    required this.username,
    required this.rating,
    required this.comment,
    required this.image,
    required this.createdAt,
  });

  factory CustomerReview.fromJson(Map<String, dynamic> j) => CustomerReview(
        id: asInt(j['id']),
        productId: asInt(j['product']),
        username: asString(j['username'], 'Customer'),
        rating: asInt(j['rating']),
        comment: asString(j['comment']),
        image: asString(j['image']),
        createdAt: asDate(j['created_at']),
      );

  final int id;
  final int productId;
  final String username;
  final int rating;
  final String comment;
  final String image;
  final DateTime? createdAt;
}

enum ProductSort {
  relevance(null, 'Relevance'),
  newest('-created_at', 'Newest first'),
  priceLow('price', 'Price: low to high'),
  priceHigh('-price', 'Price: high to low'),
  rating('-rating', 'Top rated');

  const ProductSort(this.ordering, this.label);
  final String? ordering;
  final String label;
}

/// Filters accepted by ProductViewSet.get_queryset. Value-equal so it can key
/// a Riverpod family.
class ProductQuery {
  const ProductQuery({
    this.search,
    this.category,
    this.brand,
    this.minPrice,
    this.maxPrice,
    this.minRating,
    this.inStockOnly = false,
    this.sort = ProductSort.relevance,
  });

  final String? search;
  final String? category;
  final String? brand;
  final int? minPrice;
  final int? maxPrice;
  final int? minRating;
  final bool inStockOnly;
  final ProductSort sort;

  int get activeFilterCount => [
        brand != null,
        minPrice != null || maxPrice != null,
        minRating != null,
        inStockOnly,
      ].where((e) => e).length;

  Map<String, dynamic> toQuery() => {
        if (search != null && search!.trim().isNotEmpty) 'search': search!.trim(),
        if (category != null && category!.isNotEmpty) 'category': category,
        if (brand != null && brand!.isNotEmpty) 'brand': brand,
        if (minPrice != null) 'min_price': minPrice,
        if (maxPrice != null) 'max_price': maxPrice,
        if (minRating != null) 'min_rating': minRating,
        if (inStockOnly) 'in_stock': 'true',
        if (sort.ordering != null) 'ordering': sort.ordering,
      };

  ProductQuery copyWith({
    String? search,
    String? category,
    String? brand,
    int? minPrice,
    int? maxPrice,
    int? minRating,
    bool? inStockOnly,
    ProductSort? sort,
    bool clearBrand = false,
    bool clearPrice = false,
    bool clearRating = false,
  }) {
    return ProductQuery(
      search: search ?? this.search,
      category: category ?? this.category,
      brand: clearBrand ? null : (brand ?? this.brand),
      minPrice: clearPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearPrice ? null : (maxPrice ?? this.maxPrice),
      minRating: clearRating ? null : (minRating ?? this.minRating),
      inStockOnly: inStockOnly ?? this.inStockOnly,
      sort: sort ?? this.sort,
    );
  }

  ProductQuery clearFilters() => ProductQuery(search: search, category: category, sort: sort);

  @override
  bool operator ==(Object other) =>
      other is ProductQuery &&
      other.search == search &&
      other.category == category &&
      other.brand == brand &&
      other.minPrice == minPrice &&
      other.maxPrice == maxPrice &&
      other.minRating == minRating &&
      other.inStockOnly == inStockOnly &&
      other.sort == sort;

  @override
  int get hashCode =>
      Object.hash(search, category, brand, minPrice, maxPrice, minRating, inStockOnly, sort);
}
