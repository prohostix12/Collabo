import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The website's CAT_ICON_MAP, using the same lucide icons so categories look
/// identical on both.
class CategoryIcons {
  const CategoryIcons._();

  static const _map = <String, IconData>{
    'All': LucideIcons.layoutGrid,
    'Electronics': LucideIcons.cpu,
    'Mobiles': LucideIcons.smartphone,
    'Fashion': LucideIcons.shirt,
    'Grocery': LucideIcons.shoppingBasket,
    'Home & Kitchen': LucideIcons.house,
    'Beauty': LucideIcons.sparkles,
    'Furniture': LucideIcons.armchair,
    'Sports': LucideIcons.dumbbell,
    'Books': LucideIcons.bookOpen,
    'Toys': LucideIcons.gamepad2,
    'Appliances': LucideIcons.plug,
    'Mobile & Accessories': LucideIcons.headphones,
    'Health & Personal Care': LucideIcons.heartPulse,
    'Beauty & Personal Care': LucideIcons.bath,
    'Kids': LucideIcons.baby,
    'Korean Products': LucideIcons.flower2,
    'Jewellery': LucideIcons.gem,
  };

  static bool has(String name) => _map.containsKey(name);

  static IconData of(String name) => _map[name] ?? LucideIcons.layoutGrid;
}
