import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/cart.dart';
import '../../data/models/store_settings.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/product_widgets.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import '../auth/auth_controller.dart';
import '../catalog/catalog_providers.dart';
import '../checkout/domain/checkout_pricing.dart';
import 'cart_controller.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(isLoggedInProvider);
    final cart = ref.watch(cartControllerProvider);
    final count = cart.value?.items.length ?? 0;

    return Scaffold(
      appBar: AppBar(title: Text(count > 0 ? 'My Cart ($count)' : 'My Cart')),
      body: !loggedIn
          ? EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Your cart is waiting',
              message: 'Sign in to add items and see your saved cart across devices.',
              actionLabel: 'Sign in',
              onAction: () => context.push('/login'),
            )
          : cart.when(
              loading: () => const _CartSkeleton(),
              error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(cartControllerProvider)),
              data: (c) => c.isEmpty
                  ? EmptyState(
                      icon: Icons.shopping_cart_outlined,
                      title: 'Your cart is empty',
                      message: 'Explore top deals and add your favourites here.',
                      actionLabel: 'Start shopping',
                      onAction: () => context.go('/'),
                    )
                  : _CartContent(cart: c),
            ),
    );
  }
}

class _CartContent extends ConsumerWidget {
  const _CartContent({required this.cart});
  final Cart cart;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final excluded = ref.watch(cartDeselectionProvider);
    final selected = ref.watch(selectedCartItemsProvider);
    final settings = ref.watch(storeSettingsProvider).value ?? StoreSettings.fallback;
    final summary = CheckoutPricing.compute(items: selected, settings: settings);
    final allSelected = excluded.isEmpty || cart.items.every((i) => !excluded.contains(i.id));
    final blocked = selected.any((i) => !i.product.inStock || i.quantity > i.product.stock);
    final wide = MediaQuery.sizeOf(context).width >= 840;

    final list = RefreshIndicator(
      onRefresh: () => ref.read(cartControllerProvider.notifier).reload(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 24),
        children: [
          Container(
            color: Colors.white,
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.only(right: 12),
            child: Row(
            children: [
              Checkbox(
                value: allSelected,
                onChanged: (v) => ref
                    .read(cartDeselectionProvider.notifier)
                    .setAll(selected: v ?? false, itemIds: cart.items.map((i) => i.id)),
              ),
              Expanded(
                child: Text(
                  '${selected.length} of ${cart.items.length} selected',
                  style: context.text.titleSmall,
                ),
              ),
            ],
          ),
          ),
          if (selected.isNotEmpty) _FreeShippingProgress(summary: summary),
          for (final item in cart.items)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _CartItemTile(item: item, selected: !excluded.contains(item.id)),
            ),
          if (!wide) _SummaryCard(summary: summary),
        ],
      ),
    );

    final checkout = _CheckoutBar(
      payable: summary.payable,
      savings: summary.totalSavings,
      count: summary.itemCount,
      enabled: selected.isNotEmpty && !blocked,
      hint: blocked ? 'Remove out-of-stock items to continue' : null,
    );

    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 3, child: list),
          SizedBox(
            width: 380,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(0, 16, 16, 16),
              children: [_SummaryCard(summary: summary), const SizedBox(height: 16), checkout],
            ),
          ),
        ],
      );
    }
    return Column(children: [Expanded(child: list), checkout]);
  }
}

class _CartItemTile extends ConsumerStatefulWidget {
  const _CartItemTile({required this.item, required this.selected});
  final CartItem item;
  final bool selected;

  @override
  ConsumerState<_CartItemTile> createState() => _CartItemTileState();
}

class _CartItemTileState extends ConsumerState<_CartItemTile> {
  bool _busy = false;

  Future<void> _setQty(int qty) async {
    HapticFeedback.selectionClick();
    if (qty <= 0) return _remove();
    setState(() => _busy = true);
    try {
      await ref.read(cartControllerProvider.notifier).setQuantity(widget.item.id, qty);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _remove() async {
    try {
      await ref.read(cartControllerProvider.notifier).remove(widget.item.id);
      if (mounted) showAppSnack(context, 'Removed from cart');
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final p = item.product;
    final outOfStock = !p.inStock;
    final overStock = p.inStock && item.quantity > p.stock;

    return Dismissible(
      key: ValueKey('cart-${item.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        decoration: BoxDecoration(color: context.colors.error, borderRadius: BorderRadius.circular(AppSpacing.radius)),
        child: Icon(Icons.delete_outline_rounded, color: context.colors.onError),
      ),
      confirmDismiss: (_) async {
        await _remove();
        return false;
      },
      child: Card(
        shape: const RoundedRectangleBorder(),
        color: Colors.white,
        child: InkWell(
          onTap: () => context.push('/product/${p.id}'),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Checkbox(
                  value: widget.selected,
                  onChanged: (_) => ref.read(cartDeselectionProvider.notifier).toggle(item.id),
                  semanticLabel: 'Select ${p.name}',
                ),
                AppImage(
                  p.image,
                  width: 84,
                  height: 84,
                  fit: BoxFit.contain,
                  cacheWidth: 84,
                  backgroundColor: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: context.text.bodyMedium),
                      const SizedBox(height: 6),
                      PriceView(product: p),
                      if (outOfStock || overStock || p.lowStock)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            outOfStock
                                ? 'Out of stock'
                                : overStock
                                    ? 'Only ${p.stock} available'
                                    : 'Only ${p.stock} left',
                            style: context.text.labelMedium?.copyWith(
                              color: outOfStock || overStock ? context.colors.error : AppColors.warning,
                            ),
                          ),
                        ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          QuantityStepper(
                            quantity: item.quantity,
                            max: p.stock,
                            enabled: !_busy,
                            onChanged: _setQty,
                          ),
                          const Spacer(),
                          IconButton(
                            tooltip: 'Remove ${p.name}',
                            onPressed: _remove,
                            icon: const Icon(Icons.delete_outline_rounded),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FreeShippingProgress extends StatelessWidget {
  const _FreeShippingProgress({required this.summary});
  final CheckoutSummary summary;

  @override
  Widget build(BuildContext context) {
    final remaining = summary.amountToFreeShipping;
    final unlocked = remaining <= 0;
    final progress = summary.freeShippingThreshold <= 0
        ? 1.0
        : (summary.subtotal / summary.freeShippingThreshold).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Card(
        shape: const RoundedRectangleBorder(),
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    unlocked ? Icons.celebration_rounded : Icons.local_shipping_outlined,
                    size: 20,
                    color: unlocked ? context.palette.success : context.colors.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      unlocked
                          ? 'You have unlocked FREE delivery'
                          : 'Add ${formatPrice(remaining)} more for FREE delivery',
                      style: context.text.labelLarge,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TweenAnimationBuilder<double>(
                tween: Tween(end: progress),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOutCubic,
                builder: (_, v, _) => ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: v,
                    minHeight: 6,
                    color: unlocked ? context.palette.success : context.colors.primary,
                    backgroundColor: context.palette.subtleSurface,
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.summary});
  final CheckoutSummary summary;

  @override
  Widget build(BuildContext context) {
    return PriceSummaryCard(summary: summary, footnote: 'Apply coupons and rewards at checkout');
  }
}

/// Price breakdown shared by the bag and checkout.
class PriceSummaryCard extends StatelessWidget {
  const PriceSummaryCard({super.key, required this.summary, this.footnote});

  final CheckoutSummary summary;
  final String? footnote;

  @override
  Widget build(BuildContext context) {
    final green = context.palette.discount;
    Widget row(String label, String value, {Color? color, bool bold = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: bold ? context.text.titleMedium : context.text.bodyMedium,
                ),
              ),
              Text(
                value,
                style: (bold ? context.text.titleMedium : context.text.bodyMedium)
                    ?.copyWith(color: color, fontWeight: bold ? FontWeight.w800 : FontWeight.w600),
              ),
            ],
          ),
        );

    return Card(
      shape: const RoundedRectangleBorder(),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Price details (${summary.itemCount} item${summary.itemCount == 1 ? '' : 's'})',
                style: context.text.titleSmall?.copyWith(color: context.palette.mutedText, fontWeight: FontWeight.w700)),
            const Divider(height: 20),
            row('Total MRP', formatPrice(summary.mrpTotal)),
            if (summary.productDiscount > 0) row('Discount on MRP', '− ${formatPrice(summary.productDiscount)}', color: green),
            if (summary.couponDiscount > 0) row('Coupon discount', '− ${formatPrice(summary.couponDiscount)}', color: green),
            row(
              'Delivery',
              summary.deliveryCharge == 0 ? 'FREE' : formatPrice(summary.deliveryCharge),
              color: summary.deliveryCharge == 0 ? green : null,
            ),
            if (summary.pointsRedeemed > 0) row('Reward points', '− ${formatPrice(summary.pointsRedeemed)}', color: green),
            if (summary.walletRedeemed > 0) row('Wallet', '− ${formatPrice(summary.walletRedeemed)}', color: green),
            const Divider(height: 20),
            row('Total amount', formatPrice(summary.payable), bold: true),
            if (summary.totalSavings > 0)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 10),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(2),
                ),
                child: Text(
                  'You save ${formatPrice(summary.totalSavings)} on this order',
                  style: context.text.labelLarge?.copyWith(color: green),
                ),
              ),
            if (footnote != null) ...[
              const SizedBox(height: 10),
              Text(footnote!, style: context.text.bodySmall?.copyWith(color: context.palette.mutedText)),
            ],
          ],
        ),
      ),
    );
  }
}

class _CheckoutBar extends StatelessWidget {
  const _CheckoutBar({
    required this.payable,
    required this.savings,
    required this.count,
    required this.enabled,
    this.hint,
  });

  final double payable;
  final double savings;
  final int count;
  final bool enabled;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 12,
      shadowColor: Colors.black38,
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hint != null)
              Container(
                width: double.infinity,
                color: const Color(0xFFFDECEA),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Text(hint!, style: context.text.labelMedium?.copyWith(color: context.colors.error)),
              ),
            Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (savings > 0)
                          Text(
                            'Saving ${formatPrice(savings)}',
                            style: context.text.labelSmall?.copyWith(color: context.palette.discount, fontWeight: FontWeight.w700),
                          ),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          transitionBuilder: (c, a) => FadeTransition(opacity: a, child: c),
                          child: Text(
                            formatPrice(payable),
                            key: ValueKey(payable),
                            style: context.text.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(
                  width: 190,
                  height: 56,
                  child: Material(
                    color: enabled ? AppColors.cta : const Color(0xFFBDBDBD),
                    child: InkWell(
                      onTap: enabled ? () => context.push('/checkout') : null,
                      child: Center(
                        child: Text(
                          count > 0 ? 'Place order ($count)' : 'Place order',
                          style: context.text.titleSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartSkeleton extends StatelessWidget {
  const _CartSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (_, _) => const Skeleton(height: 120, radius: 2),
      ),
    );
  }
}
