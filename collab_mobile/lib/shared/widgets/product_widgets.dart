import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/product.dart';
import '../../features/auth/auth_gate.dart';
import '../../features/wishlist/wishlist_controller.dart';
import 'app_image.dart';
import 'feedback.dart';
import 'motion.dart';
import 'shimmer.dart';

class PriceView extends StatelessWidget {
  const PriceView({super.key, required this.product, this.large = false});

  final Product product;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final percent = product.effectiveDiscountPercent;
    final priceStyle = (large ? context.text.headlineSmall : context.text.titleMedium)
        ?.copyWith(fontWeight: FontWeight.w800, height: 1.1);
    final strikeStyle = (large ? context.text.bodyLarge : context.text.bodySmall)?.copyWith(
      color: context.palette.mutedText,
      decoration: TextDecoration.lineThrough,
    );
    final offStyle = (large ? context.text.titleSmall : context.text.labelMedium)?.copyWith(
      color: context.palette.discount,
      fontWeight: FontWeight.w800,
    );

    final label = 'Price ${formatPrice(product.sellingPrice)}'
        '${product.hasDiscount ? ', was ${formatPrice(product.price)}, $percent percent off' : ''}';

    if (!large) {
      return Semantics(
        label: label,
        excludeSemantics: true,
        child: Text.rich(
          TextSpan(children: [
            TextSpan(text: formatPrice(product.sellingPrice), style: priceStyle),
            if (product.hasDiscount) ...[
              const TextSpan(text: '  '),
              TextSpan(text: formatPrice(product.price), style: strikeStyle),
              if (percent > 0) TextSpan(text: '  $percent% off', style: offStyle),
            ],
          ]),
          maxLines: 1,
          overflow: TextOverflow.fade,
          softWrap: false,
        ),
      );
    }

    return Semantics(
      label: label,
      excludeSemantics: true,
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.end,
        spacing: 6,
        runSpacing: 2,
        children: [
          Text(formatPrice(product.sellingPrice), style: priceStyle),
          if (product.hasDiscount) ...[
            Text(formatPrice(product.price), style: strikeStyle),
            if (percent > 0) Text('$percent% off', style: offStyle),
          ],
        ],
      ),
    );
  }
}

class RatingBadge extends StatelessWidget {
  const RatingBadge({super.key, required this.rating, this.count, this.dense = false});

  final double rating;
  final int? count;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    if (rating <= 0) return const SizedBox.shrink();
    return Semantics(
      label: 'Rated ${rating.toStringAsFixed(1)} out of 5${count != null ? ' from $count reviews' : ''}',
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: dense ? 5 : 7, vertical: dense ? 1.5 : 3),
            decoration: BoxDecoration(
              color: context.palette.rating,
              borderRadius: BorderRadius.circular(3),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  rating.toStringAsFixed(1),
                  style: (dense ? context.text.labelSmall : context.text.labelMedium)
                      ?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
                const SizedBox(width: 2),
                Icon(Icons.star_rounded, size: dense ? 11 : 14, color: Colors.white),
              ],
            ),
          ),
          if (count != null && count! > 0) ...[
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                '($count)',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.text.labelSmall?.copyWith(color: context.palette.mutedText),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class WishlistButton extends ConsumerWidget {
  const WishlistButton({super.key, required this.productId, this.filled = true, this.size = 20});

  final int productId;
  final bool filled;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(isWishlistedProvider(productId));
    final icon = AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
      child: Icon(
        active ? Icons.favorite_rounded : Icons.favorite_border_rounded,
        key: ValueKey(active),
        size: size,
        color: active ? AppColors.cta : context.colors.onSurface,
      ),
    );

    Future<void> toggle() async {
      if (!await ensureSignedIn(context, ref, reason: 'Sign in to save items to your wishlist')) return;
      HapticFeedback.selectionClick();
      try {
        final added = await ref.read(wishlistControllerProvider.notifier).toggle(productId);
        if (context.mounted) {
          showAppSnack(context, added ? 'Added to wishlist' : 'Removed from wishlist');
        }
      } catch (e) {
        if (context.mounted) showErrorSnack(context, e);
      }
    }

    final tooltip = active ? 'Remove from wishlist' : 'Add to wishlist';
    if (!filled) return IconButton(tooltip: tooltip, onPressed: toggle, icon: icon);
    return Material(
      color: context.colors.surface.withValues(alpha: 0.92),
      shape: const CircleBorder(),
      elevation: 1,
      shadowColor: Colors.black26,
      child: IconButton(
        tooltip: tooltip,
        visualDensity: VisualDensity.compact,
        constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
        onPressed: toggle,
        icon: icon,
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, this.heroPrefix = 'grid'});

  final Product product;

  /// Disambiguates Hero tags when the same product appears in two shelves.
  final String heroPrefix;

  static const infoHeight = 84.0;

  @override
  Widget build(BuildContext context) {
    final heroTag = '$heroPrefix-product-${product.id}';
    return PressScale(
      child: Card(
      clipBehavior: Clip.antiAlias,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
        side: BorderSide(color: Color(0xFFEDEDED)),
      ),
      child: InkWell(
        onTap: () => context.push('/product/${product.id}', extra: ProductRouteExtra(product, heroTag)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: heroTag,
                    child: AppImage(
                      product.image,
                      fit: BoxFit.contain,
                      cacheWidth: 260,
                      backgroundColor: Colors.white,
                      semanticLabel: product.name,
                    ),
                  ),
                  if (product.effectiveDiscountPercent >= 5)
                    Positioned(
                      left: 8,
                      top: 8,
                      child: _Tag(
                        label: '${product.effectiveDiscountPercent}% OFF',
                        color: context.palette.discount,
                      ),
                    ),
                  Positioned(right: 6, top: 6, child: WishlistButton(productId: product.id, size: 18)),
                  if (product.rating > 0)
                    Positioned(
                      left: 6,
                      bottom: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              product.rating.toStringAsFixed(1),
                              style: context.text.labelMedium?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(width: 2),
                            Icon(Icons.star_rounded, size: 13, color: context.palette.rating),
                            if (product.reviewsCount > 0)
                              Text(
                                ' (${product.reviewsCount})',
                                style: context.text.labelSmall?.copyWith(color: context.palette.mutedText),
                              ),
                          ],
                        ),
                      ),
                    ),
                  if (!product.inStock)
                    Positioned.fill(
                      child: ColoredBox(
                        color: Colors.white.withValues(alpha: 0.6),
                        child: const Center(child: _Tag(label: 'OUT OF STOCK', color: Colors.black87)),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (product.brand.isNotEmpty)
                      Text(
                        product.brand,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.labelSmall?.copyWith(
                          color: const Color(0xFF212121),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    // Flexible lets the name drop to one line at large text sizes instead of overflowing.
                    Flexible(
                      child: Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: context.text.bodySmall?.copyWith(color: const Color(0xFF565656), height: 1.25),
                      ),
                    ),
                    const SizedBox(height: 4),
                    PriceView(product: product),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
    );
  }
}

class ProductRouteExtra {
  const ProductRouteExtra(this.product, this.heroTag);
  final Product product;
  final String heroTag;
}

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
      child: Text(
        label,
        style: context.text.labelSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.3),
      ),
    );
  }
}

/// Grid that sizes tiles from the available width and the user's text scale,
/// so cards never overflow on large fonts or tablets.
class ProductGridDelegate {
  static SliverGridDelegate forWidth(BuildContext context, double width) {
    final columns = (width / 200).floor().clamp(2, 6);
    final tileWidth = (width - 16 - (columns - 1) * 8) / columns;
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    return SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: columns,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      mainAxisExtent: tileWidth + ProductCard.infoHeight * textScale + 16,
    );
  }
}

class SliverProductGrid extends StatelessWidget {
  const SliverProductGrid({super.key, required this.products, this.heroPrefix = 'grid'});

  final List<Product> products;
  final String heroPrefix;

  @override
  Widget build(BuildContext context) {
    return SliverLayoutBuilder(
      builder: (context, constraints) => SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        sliver: SliverGrid(
          gridDelegate: ProductGridDelegate.forWidth(context, constraints.crossAxisExtent),
          delegate: SliverChildBuilderDelegate(
            (context, i) => FadeSlideIn(
              index: i % 6,
              offset: 0,
              child: RepaintBoundary(
                child: ProductCard(product: products[i], heroPrefix: heroPrefix),
              ),
            ),
            childCount: products.length,
          ),
        ),
      ),
    );
  }
}

class SliverProductGridSkeleton extends StatelessWidget {
  const SliverProductGridSkeleton({super.key, this.count = 6});
  final int count;

  @override
  Widget build(BuildContext context) {
    return SliverLayoutBuilder(
      builder: (context, constraints) => SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        sliver: SliverGrid(
          gridDelegate: ProductGridDelegate.forWidth(context, constraints.crossAxisExtent),
          delegate: SliverChildBuilderDelegate((context, i) => const ProductCardSkeleton(), childCount: count),
        ),
      ),
    );
  }
}

class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const Shimmer(
      child: Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(aspectRatio: 1, child: Skeleton(radius: 0)),
            Padding(
              padding: EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Skeleton(height: 12, width: double.infinity),
                  SizedBox(height: 6),
                  Skeleton(height: 12, width: 90),
                  SizedBox(height: 10),
                  Skeleton(height: 16, width: 70),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal shelf used on the home screen.
class ProductShelf extends StatelessWidget {
  const ProductShelf({super.key, required this.products, required this.heroPrefix});

  final List<Product> products;
  final String heroPrefix;

  @override
  Widget build(BuildContext context) {
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    const tileWidth = 164.0;
    return ColoredBox(
      color: Colors.white,
      child: SizedBox(
        height: tileWidth + ProductCard.infoHeight * textScale + 20,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          scrollDirection: Axis.horizontal,
          itemCount: products.length,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, i) => SizedBox(
            width: tileWidth,
            child: FadeSlideIn(
              index: i,
              offset: 0,
              child: RepaintBoundary(
                child: ProductCard(product: products[i], heroPrefix: heroPrefix),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ProductShelfSkeleton extends StatelessWidget {
  const ProductShelfSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    return ColoredBox(
      color: Colors.white,
      child: SizedBox(
        height: 164 + ProductCard.infoHeight * textScale + 20,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 4,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (_, _) => const SizedBox(width: 164, child: ProductCardSkeleton()),
        ),
      ),
    );
  }
}

class QuantityStepper extends StatelessWidget {
  const QuantityStepper({
    super.key,
    required this.quantity,
    required this.onChanged,
    this.max,
    this.enabled = true,
  });

  final int quantity;
  final ValueChanged<int> onChanged;
  final int? max;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final canIncrease = enabled && (max == null || quantity < max!);
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: context.theme.dividerTheme.color ?? Colors.grey),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: quantity <= 1 ? 'Remove' : 'Decrease quantity',
            visualDensity: VisualDensity.compact,
            onPressed: enabled ? () => onChanged(quantity - 1) : null,
            icon: Icon(quantity <= 1 ? Icons.delete_outline_rounded : Icons.remove_rounded, size: 18),
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 160),
            transitionBuilder: (child, a) => ScaleTransition(scale: a, child: child),
            child: Text(
              '$quantity',
              key: ValueKey(quantity),
              style: context.text.titleSmall,
              semanticsLabel: 'Quantity $quantity',
            ),
          ),
          IconButton(
            tooltip: 'Increase quantity',
            visualDensity: VisualDensity.compact,
            onPressed: canIncrease ? () => onChanged(quantity + 1) : null,
            icon: const Icon(Icons.add_rounded, size: 18),
          ),
        ],
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.subtitle, this.onSeeAll, this.trailing});

  final String title;
  final String? subtitle;
  final VoidCallback? onSeeAll;

  /// Shown before the see-all arrow, e.g. a countdown.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  header: true,
                  child: Text(title, style: context.text.titleMedium?.copyWith(fontSize: 18, fontWeight: FontWeight.w700)),
                ),
                if (subtitle != null && subtitle!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      subtitle!,
                      style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
                    ),
                  ),
              ],
            ),
          ),
          if (trailing != null) ...[trailing!, const SizedBox(width: 8)],
          if (onSeeAll != null)
            Semantics(
              button: true,
              label: 'See all $title',
              excludeSemantics: true,
              child: Material(
                color: AppColors.primary,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onSeeAll,
                  child: const Padding(
                    padding: EdgeInsets.all(6),
                    child: Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
