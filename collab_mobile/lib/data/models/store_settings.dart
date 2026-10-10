import '../../core/utils/json.dart';

class Coupon {
  const Coupon({
    required this.code,
    required this.discountPercent,
    required this.description,
    this.image = '',
    this.productId,
  });

  factory Coupon.fromJson(Map<String, dynamic> j) => Coupon(
        code: asString(j['code']).toUpperCase(),
        discountPercent: asDouble(j['discount_percent']),
        description: asString(j['description']),
        image: asString(j['image']),
        productId: asIntOrNull(j['product_id']),
      );

  final String code;
  final double discountPercent;
  final String description;

  /// Optional banner image set by the admin; the website prefers it over the
  /// linked product's image.
  final String image;
  final int? productId;
}

class HeroSlide {
  const HeroSlide({required this.title, required this.subtitle, required this.label, required this.image});

  factory HeroSlide.fromJson(Map<String, dynamic> j) => HeroSlide(
        title: asString(j['title']),
        subtitle: asString(j['subtitle']),
        label: asString(j['label']),
        image: asString(j['image']),
      );

  final String title;
  final String subtitle;
  final String label;
  final String image;
}

/// Public storefront configuration from /ecommerce/store-settings/.
class StoreSettings {
  const StoreSettings({
    required this.tickerText,
    required this.heroBadgeText,
    required this.heroHeadline,
    required this.heroSubheadline,
    required this.categoryImages,
    required this.showDeals,
    required this.dealsProductIds,
    required this.showWeeklyDeals,
    required this.weeklyDealsProductIds,
    required this.trendingProductIds,
    required this.trendingPhonesTitle,
    required this.trendingPhonesSubtitle,
    required this.trendingPhonesProductIds,
    required this.coupons,
    required this.heroSlides,
    required this.shippingCharge,
    required this.freeShippingThreshold,
    this.dealsCycleAnchor,
    this.dealsTimerHours = 4,
    this.weeklyDealsCycleAnchor,
    this.weeklyDealsTimerHours = 24,
  });

  factory StoreSettings.fromJson(Map<String, dynamic> j) => StoreSettings(
        tickerText: asString(j['ticker_text']),
        heroBadgeText: asString(j['hero_badge_text']),
        heroHeadline: asString(j['hero_headline']),
        heroSubheadline: asString(j['hero_subheadline']),
        categoryImages: asMap(j['category_images'])
            .map((k, v) => MapEntry(k, asString(v)))
          ..removeWhere((_, v) => v.isEmpty),
        showDeals: asBool(j['show_deals_section'], true),
        dealsProductIds: asIntList(j['deals_product_ids']),
        showWeeklyDeals: asBool(j['show_weekly_deals_section'], true),
        weeklyDealsProductIds: asIntList(j['weekly_deals_product_ids']),
        trendingProductIds: asIntList(j['trending_product_ids']),
        trendingPhonesTitle: asString(j['trending_phones_title']),
        trendingPhonesSubtitle: asString(j['trending_phones_subtitle']),
        trendingPhonesProductIds: asIntList(j['trending_phones_product_ids']),
        coupons: asMapList(j['coupon_codes']).map(Coupon.fromJson).where((c) => c.code.isNotEmpty).toList(),
        heroSlides: asMapList(j['hero_card_slides']).map(HeroSlide.fromJson).toList(),
        shippingCharge: asDouble(j['shipping_charge'], 99),
        freeShippingThreshold: asDouble(j['free_shipping_threshold'], 500),
        dealsCycleAnchor: asDate(j['deals_cycle_anchor']),
        dealsTimerHours: asInt(j['deals_timer_hours'], 4),
        weeklyDealsCycleAnchor: asDate(j['weekly_deals_cycle_anchor']),
        weeklyDealsTimerHours: asInt(j['weekly_deals_timer_hours'], 24),
      );

  static const fallback = StoreSettings(
    tickerText: '',
    heroBadgeText: '',
    heroHeadline: '',
    heroSubheadline: '',
    categoryImages: {},
    showDeals: false,
    dealsProductIds: [],
    showWeeklyDeals: false,
    weeklyDealsProductIds: [],
    trendingProductIds: [],
    trendingPhonesTitle: '',
    trendingPhonesSubtitle: '',
    trendingPhonesProductIds: [],
    coupons: [],
    heroSlides: [],
    shippingCharge: 99,
    freeShippingThreshold: 500,
  );

  final String tickerText;
  final String heroBadgeText;
  final String heroHeadline;
  final String heroSubheadline;
  final Map<String, String> categoryImages;
  final bool showDeals;
  final List<int> dealsProductIds;
  final bool showWeeklyDeals;
  final List<int> weeklyDealsProductIds;
  final List<int> trendingProductIds;
  final String trendingPhonesTitle;
  final String trendingPhonesSubtitle;
  final List<int> trendingPhonesProductIds;
  final List<Coupon> coupons;
  final List<HeroSlide> heroSlides;
  final double shippingCharge;
  final double freeShippingThreshold;

  /// Deals reset every [dealsTimerHours] counted from this anchor, as on the website.
  final DateTime? dealsCycleAnchor;
  final int dealsTimerHours;
  final DateTime? weeklyDealsCycleAnchor;
  final int weeklyDealsTimerHours;

  Coupon? findCoupon(String code) {
    final upper = code.trim().toUpperCase();
    for (final c in coupons) {
      if (c.code == upper) return c;
    }
    return null;
  }
}
