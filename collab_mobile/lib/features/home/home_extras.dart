import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/product.dart';
import '../../shared/widgets/motion.dart';
import '../../shared/widgets/product_widgets.dart';
import '../catalog/catalog_providers.dart';

/// Repeating countdown to the end of the current deals cycle. Uses the same
/// anchor-and-period maths as the website's DealsCountdownTimer.
class DealsCountdown extends StatefulWidget {
  const DealsCountdown({super.key, required this.anchor, required this.cycleHours});

  final DateTime anchor;
  final int cycleHours;

  @override
  State<DealsCountdown> createState() => _DealsCountdownState();
}

class _DealsCountdownState extends State<DealsCountdown> {
  Timer? _timer;
  int _left = 0;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final cycleMs = (widget.cycleHours <= 0 ? 4 : widget.cycleHours) * 3600 * 1000;
    final now = DateTime.now().millisecondsSinceEpoch;
    final anchor = widget.anchor.millisecondsSinceEpoch;
    final passed = ((now - anchor) / cycleMs).floor();
    final end = anchor + (passed + 1) * cycleMs;
    final left = ((end - now) / 1000).round().clamp(0, 1 << 30);
    if (mounted) setState(() => _left = left);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String two(int v) => v.toString().padLeft(2, '0');
    final text = '${two(_left ~/ 3600)}:${two((_left % 3600) ~/ 60)}:${two(_left % 60)}';
    return Semantics(
      label: 'Ends in $text',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(color: const Color(0xFFFFF1EA), borderRadius: BorderRadius.circular(4)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.timer_outlined, size: 14, color: AppColors.cta),
            const SizedBox(width: 4),
            Text(
              text,
              style: const TextStyle(
                fontFeatures: [FontFeature.tabularFigures()],
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: AppColors.cta,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The website's three reassurance cards: referral, delivery and payments.
class TrustStrip extends StatelessWidget {
  const TrustStrip({super.key, required this.freeShippingThreshold});

  final double freeShippingThreshold;

  @override
  Widget build(BuildContext context) {
    final items = <(IconData, Color, String, String, VoidCallback?)>[
      (Icons.card_giftcard_rounded, AppColors.cta, 'Refer & Earn', 'Invite Friends, Get Rewards', () => context.go('/account')),
      (
        Icons.local_shipping_outlined,
        AppColors.primary,
        'Free Fast Delivery',
        'On all orders over ${formatPrice(freeShippingThreshold)}',
        null,
      ),
      (Icons.verified_user_outlined, AppColors.success, 'Secure Payments', 'Quick Withdrawals, Zero Hassle', null),
    ];
    return Container(
      margin: const EdgeInsets.only(top: 8),
      color: Colors.white,
      height: 84,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final (icon, color, title, sub, onTap) = items[i];
          return PressScale(
            child: Material(
              color: color.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(4),
              child: InkWell(
                borderRadius: BorderRadius.circular(4),
                onTap: onTap,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    children: [
                      Icon(icon, color: color, size: 28),
                      const SizedBox(width: 10),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: context.text.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
                          Text(sub, style: context.text.bodySmall?.copyWith(color: context.palette.mutedText)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Trending phones with brand filter chips, like the website's section.
/// Falls back to the Mobiles category when the admin pinned no products.
class TrendingPhones extends ConsumerStatefulWidget {
  const TrendingPhones({super.key, required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  ConsumerState<TrendingPhones> createState() => _TrendingPhonesState();
}

class _TrendingPhonesState extends ConsumerState<TrendingPhones> {
  static const _known = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Nothing', 'Google'];
  static const _fallbackQuery = ProductQuery(category: 'Mobiles');
  String _brand = 'All';

  @override
  Widget build(BuildContext context) {
    final pinned = ref.watch(curatedProductsProvider(CuratedSection.trendingPhones));
    List<Product> list = pinned.value ?? const [];
    if (pinned.hasValue && list.isEmpty) {
      list = ref.watch(productShelfProvider(_fallbackQuery)).value ?? const [];
    }
    if (list.isEmpty) return const SizedBox.shrink();

    final brands = {for (final p in list) if (p.brand.isNotEmpty) p.brand};
    final ordered = [
      'All',
      ..._known.where(brands.contains),
      ...brands.where((b) => !_known.contains(b)),
    ];
    final active = ordered.contains(_brand) ? _brand : 'All';
    final shown = active == 'All' ? list : list.where((p) => p.brand == active).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: widget.title,
          subtitle: widget.subtitle,
          onSeeAll: () => context.push('/products?category=Mobiles&title=${Uri.encodeQueryComponent(widget.title)}'),
        ),
        if (ordered.length > 2)
          Container(
            color: Colors.white,
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
              scrollDirection: Axis.horizontal,
              itemCount: ordered.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final b = ordered[i];
                final on = b == active;
                return ChoiceChip(
                  label: Text(b),
                  selected: on,
                  showCheckmark: false,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(color: on ? Colors.white : const Color(0xFF212121), fontWeight: FontWeight.w600),
                  side: BorderSide(color: on ? AppColors.primary : const Color(0xFFD0D0D0)),
                  onSelected: (_) => setState(() => _brand = b),
                );
              },
            ),
          ),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: ProductShelf(key: ValueKey(active), products: shown, heroPrefix: 'phones'),
        ),
      ],
    );
  }
}
