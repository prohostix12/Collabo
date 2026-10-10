import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/validators.dart';
import '../../data/models/product.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/product_widgets.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_gate.dart';
import '../cart/cart_controller.dart';
import '../catalog/catalog_providers.dart';

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({
    super.key,
    required this.productId,
    this.initial,
    this.heroTag,
  });

  final int productId;
  final Product? initial;
  final String? heroTag;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(productProvider(productId));
    // Render the list-card data instantly while the full record loads.
    final product = async.value ?? initial;

    if (product == null) {
      return Scaffold(
        appBar: AppBar(),
        body: async.hasError
            ? ErrorView(
                error: async.error,
                onRetry: () => ref.invalidate(productProvider(productId)),
              )
            : const _DetailSkeleton(),
      );
    }
    return _ProductView(
      product: product,
      heroTag: heroTag ?? 'detail-product-${product.id}',
      refreshing: async.isLoading,
      onRefresh: () => ref.refresh(productProvider(productId).future),
    );
  }
}

class _ProductView extends ConsumerStatefulWidget {
  const _ProductView({
    required this.product,
    required this.heroTag,
    required this.refreshing,
    required this.onRefresh,
  });

  final Product product;
  final String heroTag;
  final bool refreshing;
  final Future<void> Function() onRefresh;

  @override
  ConsumerState<_ProductView> createState() => _ProductViewState();
}

class _ProductViewState extends ConsumerState<_ProductView> {
  final _gallery = PageController();
  int _imageIndex = 0;
  bool _adding = false;

  Product get p => widget.product;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(recentlyViewedProvider.notifier).add(p.id);
    });
  }

  @override
  void dispose() {
    _gallery.dispose();
    super.dispose();
  }

  Future<void> _addToCart({bool buyNow = false}) async {
    if (!await ensureSignedIn(
      context,
      ref,
      reason: 'Sign in to add items to your bag',
    )) {
      return;
    }
    final cart = ref.read(cartControllerProvider).value;
    final existing = cart?.itemForProduct(p.id);
    if (existing != null) {
      if (buyNow) _goToCheckoutWith(existing.id);
      if (!buyNow && mounted) _openBag();
      return;
    }
    setState(() => _adding = true);
    try {
      await ref.read(cartControllerProvider.notifier).add(p.id);
      HapticFeedback.lightImpact();
      if (!mounted) return;
      if (buyNow) {
        final item = ref
            .read(cartControllerProvider)
            .value
            ?.itemForProduct(p.id);
        if (item != null) _goToCheckoutWith(item.id);
      } else {
        showAppSnack(
          context,
          'Added to your bag',
          action: SnackBarAction(label: 'VIEW BAG', onPressed: _openBag),
        );
      }
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  /// The bag's checkout bar sits where the snackbar floats, so clear it first.
  void _openBag() {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    context.push('/cart');
  }

  /// "Buy now" checks out just this line, leaving the rest of the bag intact.
  void _goToCheckoutWith(int cartItemId) {
    final items = ref.read(cartControllerProvider).value?.items ?? const [];
    ref
        .read(cartDeselectionProvider.notifier)
        .setAll(
          selected: false,
          itemIds: items.where((i) => i.id != cartItemId).map((i) => i.id),
        );
    context.push('/checkout');
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 840;
    final inCart =
        ref.watch(cartControllerProvider).value?.itemForProduct(p.id) != null;
    final cartCount = ref.watch(cartCountProvider);

    final gallery = _Gallery(
      product: p,
      heroTag: widget.heroTag,
      controller: _gallery,
      index: _imageIndex,
      onChanged: (i) => setState(() => _imageIndex = i),
    );
    final info = _ProductInfo(
      product: p,
      onColorTap: (image) {
        final i = p.gallery.indexOf(image);
        if (i >= 0 && _gallery.hasClients) {
          _gallery.animateToPage(
            i,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      },
    );

    final actions = [
      WishlistButton(productId: p.id, filled: false, size: 24),
      IconButton(
        tooltip: 'Cart',
        onPressed: _openBag,
        icon: Badge(
          isLabelVisible: cartCount > 0,
          label: Text('$cartCount'),
          backgroundColor: AppColors.cta,
          child: const Icon(Icons.shopping_cart_outlined),
        ),
      ),
      const SizedBox(width: 4),
    ];

    final body = wide
        ? Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: AspectRatio(aspectRatio: 1, child: gallery),
                ),
              ),
              Expanded(
                flex: 6,
                child: RefreshIndicator(
                  onRefresh: widget.onRefresh,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(0, 16, 24, 24),
                    children: [info],
                  ),
                ),
              ),
            ],
          )
        : RefreshIndicator(
            onRefresh: widget.onRefresh,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: AspectRatio(aspectRatio: 1, child: gallery),
                ),
                SliverToBoxAdapter(child: info),
              ],
            ),
          );

    return Scaffold(
      appBar: AppBar(
        title: Text(
          p.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: context.text.titleMedium,
        ),
        actions: actions,
        bottom: widget.refreshing
            ? const PreferredSize(
                preferredSize: Size.fromHeight(2),
                child: LinearProgressIndicator(minHeight: 2),
              )
            : null,
      ),
      body: body,
      bottomNavigationBar: _BuyBar(
        inStock: p.inStock,
        inCart: inCart,
        loading: _adding,
        onAdd: () => _addToCart(),
        onBuy: () => _addToCart(buyNow: true),
      ),
    );
  }
}

class _Gallery extends StatelessWidget {
  const _Gallery({
    required this.product,
    required this.heroTag,
    required this.controller,
    required this.index,
    required this.onChanged,
  });

  final Product product;
  final String heroTag;
  final PageController controller;
  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final images = product.gallery.isEmpty ? [''] : product.gallery;
    final width = MediaQuery.sizeOf(context).width;
    return ColoredBox(
      color: Colors.white,
      child: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: controller,
              itemCount: images.length,
              onPageChanged: onChanged,
              itemBuilder: (context, i) {
                final image = AppImage(
                  images[i],
                  fit: BoxFit.contain,
                  cacheWidth: width.clamp(300, 900),
                  semanticLabel:
                      '${product.name}, image ${i + 1} of ${images.length}',
                );
                return GestureDetector(
                  onTap: () => _openViewer(context, images, i),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: i == 0 ? Hero(tag: heroTag, child: image) : image,
                  ),
                );
              },
            ),
          ),
          if (images.length > 1)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < images.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: i == index ? 18 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: i == index ? AppColors.primary : Colors.black26,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _openViewer(BuildContext context, List<String> images, int initial) {
    Navigator.of(context).push(
      PageRouteBuilder<void>(
        opaque: false,
        barrierColor: Colors.black,
        pageBuilder: (_, _, _) =>
            _FullScreenGallery(images: images, initial: initial),
        transitionsBuilder: (_, a, _, child) =>
            FadeTransition(opacity: a, child: child),
      ),
    );
  }
}

class _FullScreenGallery extends StatefulWidget {
  const _FullScreenGallery({required this.images, required this.initial});
  final List<String> images;
  final int initial;

  @override
  State<_FullScreenGallery> createState() => _FullScreenGalleryState();
}

class _FullScreenGalleryState extends State<_FullScreenGallery> {
  late final _controller = PageController(initialPage: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.images.length,
        itemBuilder: (_, i) => InteractiveViewer(
          maxScale: 4,
          child: Center(child: AppImage(widget.images[i], fit: BoxFit.contain)),
        ),
      ),
    );
  }
}

class _ProductInfo extends ConsumerWidget {
  const _ProductInfo({required this.product, required this.onColorTap});

  final Product product;
  final ValueChanged<String> onColorTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = product;
    final settings = ref.watch(storeSettingsProvider).value;
    final muted = context.palette.mutedText;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (p.brand.isNotEmpty || p.category.isNotEmpty)
                Text(
                  [p.brand, p.category].where((s) => s.isNotEmpty).join(' · '),
                  style: context.text.labelMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              const SizedBox(height: 6),
              Text(
                p.name,
                style: context.text.titleMedium?.copyWith(
                  fontSize: 17,
                  fontWeight: FontWeight.w400,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 10),
              RatingBadge(rating: p.rating, count: p.reviewsCount),
              const SizedBox(height: 14),
              PriceView(product: p, large: true),
              const SizedBox(height: 4),
              Text(
                'Inclusive of all taxes',
                style: context.text.bodySmall?.copyWith(color: muted),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final u = ref.read(currentUserProvider);
                        final url = 'https://collabo.co.in/product/${p.id}${u != null && u.affiliateCode.isNotEmpty ? '?ref=${u.affiliateCode}' : ''}';
                        Share.share('Get an exclusive discount on ${p.name} using my link! $url');
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        side: const BorderSide(color: Color(0xFF006D8F)), // Peacock Blue
                        foregroundColor: const Color(0xFF006D8F),
                      ),
                      icon: const Icon(Icons.stars_rounded, size: 20),
                      label: const Text('Refer', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Share.share('Check out ${p.name} on Collabo! https://collabo.co.in/product/${p.id}');
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        side: const BorderSide(color: Color(0xFF006D8F)), // Peacock Blue
                        foregroundColor: const Color(0xFF006D8F),
                      ),
                      icon: const Icon(Icons.share_rounded, size: 20),
                      label: const Text('Share'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _StockLine(product: p),
              if (p.colors.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text('Colours', style: context.text.titleSmall),
                const SizedBox(height: 10),
                SizedBox(
                  height: 84,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: p.colors.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (context, i) {
                      final c = p.colors[i];
                      return Semantics(
                        button: true,
                        label: 'Colour ${c.name}',
                        excludeSemantics: true,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(4),
                          onTap: c.image.isEmpty
                              ? null
                              : () => onColorTap(c.image),
                          child: Column(
                            children: [
                              AppImage(
                                c.image,
                                width: 56,
                                height: 56,
                                fit: BoxFit.contain,
                                cacheWidth: 56,
                                backgroundColor: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              const SizedBox(height: 4),
                              Text(c.name, style: context.text.labelSmall),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
        if (p.offers.isNotEmpty) ...[
          const SizedBox(height: 8),
          _Block(
            title: 'Available offers',
            child: Column(
              children: [
                for (final o in p.offers)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.local_offer_rounded,
                          size: 18,
                          color: context.palette.discount,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(o, style: context.text.bodyMedium),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 8),
        _DeliveryBlock(
          product: p,
          freeShippingThreshold: settings?.freeShippingThreshold,
        ),
        if (p.highlights.isNotEmpty) ...[
          const SizedBox(height: 8),
          _Block(
            title: 'Highlights',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final h in p.highlights)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 7),
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: context.colors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            h,
                            style: context.text.bodyMedium?.copyWith(
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
        if (p.description.trim().isNotEmpty) ...[
          const SizedBox(height: 8),
          _Block(
            title: 'Description',
            child: _ExpandableText(text: p.description.trim()),
          ),
        ],
        if (p.specifications.isNotEmpty) ...[
          const SizedBox(height: 8),
          _Block(
            title: 'Specifications',
            child: Table(
              columnWidths: const {
                0: FlexColumnWidth(2),
                1: FlexColumnWidth(3),
              },
              children: [
                for (final s in p.specifications)
                  TableRow(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        child: Text(
                          s.name,
                          style: context.text.bodyMedium?.copyWith(
                            color: muted,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        child: Text(s.value, style: context.text.bodyMedium),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
        if (p.qa.isNotEmpty) ...[
          const SizedBox(height: 8),
          _Block(
            title: 'Questions & answers',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final q in p.qa)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Q: ${q.question}',
                          style: context.text.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'A: ${q.answer}',
                          style: context.text.bodyMedium?.copyWith(
                            color: muted,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 8),
        _ReviewsBlock(product: p),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _StockLine extends StatelessWidget {
  const _StockLine({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final (label, color, icon) = !product.inStock
        ? (
            'Out of stock',
            context.colors.error,
            Icons.remove_shopping_cart_outlined,
          )
        : product.lowStock
        ? (
            'Hurry, only ${product.stock} left',
            AppColors.warning,
            Icons.timer_outlined,
          )
        : (
            'In stock',
            context.palette.success,
            Icons.check_circle_outline_rounded,
          );
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 6),
        Text(label, style: context.text.labelLarge?.copyWith(color: color)),
      ],
    );
  }
}

class _Block extends StatelessWidget {
  const _Block({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(
            header: true,
            child: Text(
              title,
              style: context.text.titleMedium?.copyWith(
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _ExpandableText extends StatefulWidget {
  const _ExpandableText({required this.text});
  final String text;

  @override
  State<_ExpandableText> createState() => _ExpandableTextState();
}

class _ExpandableTextState extends State<_ExpandableText> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final long = widget.text.length > 280;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 250),
          alignment: Alignment.topCenter,
          child: Text(
            widget.text,
            maxLines: _expanded || !long ? null : 5,
            overflow: _expanded || !long ? null : TextOverflow.ellipsis,
            style: context.text.bodyMedium?.copyWith(height: 1.5),
          ),
        ),
        if (long)
          TextButton(
            style: TextButton.styleFrom(padding: EdgeInsets.zero),
            onPressed: () => setState(() => _expanded = !_expanded),
            child: Text(_expanded ? 'Show less' : 'Read more'),
          ),
      ],
    );
  }
}

class _DeliveryBlock extends ConsumerStatefulWidget {
  const _DeliveryBlock({
    required this.product,
    required this.freeShippingThreshold,
  });
  final Product product;
  final double? freeShippingThreshold;

  @override
  ConsumerState<_DeliveryBlock> createState() => _DeliveryBlockState();
}

class _DeliveryBlockState extends ConsumerState<_DeliveryBlock> {
  final _pin = TextEditingController();
  PincodeResult? _result;
  bool _checking = false;

  @override
  void dispose() {
    _pin.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    final error = Validators.pincode(_pin.text);
    if (error != null) {
      setState(() => _result = PincodeResult(available: false, message: error));
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _checking = true);
    try {
      final r = await ref
          .read(catalogRepositoryProvider)
          .checkPincode(_pin.text.trim());
      if (mounted) setState(() => _result = r);
    } on ApiException catch (e) {
      if (mounted) {
        setState(
          () => _result = PincodeResult(available: false, message: e.message),
        );
      }
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final muted = context.palette.mutedText;
    final threshold = widget.freeShippingThreshold;
    return _Block(
      title: 'Delivery & returns',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _pin,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onSubmitted: (_) => _check(),
                  decoration: const InputDecoration(
                    hintText: 'Enter delivery PIN code',
                    prefixIcon: Icon(Icons.location_on_outlined),
                    counterText: '',
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 50,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(80, 50),
                  ),
                  onPressed: _checking ? null : _check,
                  child: _checking
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Check'),
                ),
              ),
            ],
          ),
          if (_result != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Semantics(
                liveRegion: true,
                child: Text(
                  _result!.message,
                  style: context.text.bodySmall?.copyWith(
                    color: _result!.available
                        ? context.palette.success
                        : context.colors.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 14),
          if (p.displayDelivery.isNotEmpty)
            _InfoRow(
              icon: Icons.local_shipping_outlined,
              text: p.displayDelivery,
            ),
          if (threshold != null)
            _InfoRow(
              icon: Icons.savings_outlined,
              text: 'Free delivery on orders above ${formatPrice(threshold)}',
            ),
          if (p.displayReturnPolicy.isNotEmpty)
            _InfoRow(
              icon: Icons.assignment_return_outlined,
              text: p.displayReturnPolicy,
            ),
          _InfoRow(
            icon: Icons.payments_outlined,
            text: 'Cash on Delivery & secure online payments',
            color: muted,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text, this.color});
  final IconData icon;
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color ?? context.colors.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: context.text.bodyMedium)),
        ],
      ),
    );
  }
}

class _ReviewsBlock extends ConsumerWidget {
  const _ReviewsBlock({required this.product});
  final Product product;

  Future<void> _write(BuildContext context, WidgetRef ref) async {
    if (!await ensureSignedIn(
      context,
      ref,
      reason: 'Sign in to review this product',
    )) {
      return;
    }
    if (!context.mounted) return;
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => WriteReviewSheet(product: product),
    );
    if (submitted == true) {
      ref.invalidate(productReviewsProvider(product.id));
      ref.invalidate(productProvider(product.id));
      ref.read(authControllerProvider.notifier).refreshProfile();
      if (context.mounted) {
        showAppSnack(
          context,
          'Thanks for your review! You earned reward points.',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviews = ref.watch(productReviewsProvider(product.id));
    return _Block(
      title: 'Ratings & reviews',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (product.rating > 0) ...[
                Text(
                  product.rating.toStringAsFixed(1),
                  style: context.text.headlineMedium,
                ),
                const SizedBox(width: 6),
                const Icon(Icons.star_rounded, color: Color(0xFFF5A623)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${product.reviewsCount} ratings',
                    style: context.text.bodySmall?.copyWith(
                      color: context.palette.mutedText,
                    ),
                  ),
                ),
              ] else
                const Expanded(child: Text('No ratings yet')),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(minimumSize: const Size(0, 40)),
                onPressed: () => _write(context, ref),
                icon: const Icon(Icons.rate_review_outlined, size: 18),
                label: const Text('Write'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          reviews.when(
            loading: () => const Shimmer(child: Skeleton(height: 60)),
            error: (e, _) => TextButton.icon(
              onPressed: () =>
                  ref.invalidate(productReviewsProvider(product.id)),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry loading reviews'),
            ),
            data: (page) => page.items.isEmpty
                ? Text(
                    'Be the first to share your experience.',
                    style: context.text.bodyMedium?.copyWith(
                      color: context.palette.mutedText,
                    ),
                  )
                : Column(
                    children: [
                      for (final r in page.items.take(5))
                        _ReviewTile(review: r),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});
  final CustomerReview review;

  @override
  Widget build(BuildContext context) {
    final isVideo = review.image.startsWith('data:video') ||
        review.image.endsWith('.mp4') ||
        review.image.endsWith('.mov') ||
        review.image.endsWith('.webm');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RatingBadge(rating: review.rating.toDouble(), dense: true),
              const SizedBox(width: 8),
              Expanded(
                child: Text(review.username, style: context.text.titleSmall),
              ),
              Text(
                formatDate(review.createdAt),
                style: context.text.labelSmall?.copyWith(
                  color: context.palette.mutedText,
                ),
              ),
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(review.comment, style: context.text.bodyMedium),
          ],
          if (review.image.isNotEmpty) ...[
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (ctx) => Dialog(
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isVideo)
                            Container(
                              padding: const EdgeInsets.all(24),
                              color: Colors.black87,
                              child: const Column(
                                children: [
                                  Icon(Icons.play_circle_fill, color: Colors.white, size: 48),
                                  SizedBox(height: 8),
                                  Text('Video Review Attached', style: TextStyle(color: Colors.white)),
                                ],
                              ),
                            )
                          else
                            AppImage(review.image, fit: BoxFit.contain),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text('Close'),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: isVideo
                    ? Container(
                        width: 96,
                        height: 96,
                        color: Colors.black87,
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.play_circle_fill, color: AppTheme.peacockBlue, size: 32),
                            SizedBox(height: 4),
                            Text('Video', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )
                    : AppImage(
                        review.image,
                        width: 88,
                        height: 88,
                        cacheWidth: 150,
                        borderRadius: BorderRadius.circular(8),
                      ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class WriteReviewSheet extends ConsumerStatefulWidget {
  const WriteReviewSheet({super.key, required this.product});
  final Product product;

  @override
  ConsumerState<WriteReviewSheet> createState() => _WriteReviewSheetState();
}

class _WriteReviewSheetState extends ConsumerState<WriteReviewSheet> {
  int _rating = 0;
  final _comment = TextEditingController();
  bool _saving = false;
  String? _error;

  XFile? _selectedFile;
  bool _isVideo = false;
  String? _base64Media;
  bool _processingMedia = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(bool isVideo, ImageSource source) async {
    final picker = ImagePicker();
    try {
      final XFile? file = isVideo
          ? await picker.pickVideo(source: source, maxDuration: const Duration(minutes: 2))
          : await picker.pickImage(source: source, maxWidth: 1200, maxHeight: 1200, imageQuality: 85);

      if (file == null) return;

      setState(() {
        _processingMedia = true;
        _error = null;
      });

      final bytes = await file.readAsBytes();
      final ext = file.name.split('.').last.toLowerCase();
      final mimeType = isVideo ? 'video/$ext' : 'image/${ext == "jpg" ? "jpeg" : ext}';
      final base64Str = 'data:$mimeType;base64,${base64Encode(bytes)}';

      setState(() {
        _selectedFile = file;
        _isVideo = isVideo;
        _base64Media = base64Str;
        _processingMedia = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Could not select media: $e';
          _processingMedia = false;
        });
      }
    }
  }

  void _showMediaSourceOptions(bool isVideo) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: Icon(isVideo ? Icons.videocam : Icons.photo_camera, color: AppTheme.peacockBlue),
              title: Text(isVideo ? 'Record Video' : 'Take Photo'),
              onTap: () {
                Navigator.pop(ctx);
                _pickMedia(isVideo, ImageSource.camera);
              },
            ),
            ListTile(
              leading: Icon(isVideo ? Icons.video_library : Icons.photo_library, color: AppTheme.peacockBlue),
              title: Text(isVideo ? 'Choose Video from Gallery' : 'Choose Photo from Gallery'),
              onTap: () {
                Navigator.pop(ctx);
                _pickMedia(isVideo, ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_rating == 0) {
      setState(() => _error = 'Please choose a star rating');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref
          .read(catalogRepositoryProvider)
          .addReview(
            productId: widget.product.id,
            rating: _rating,
            comment: _comment.text,
            image: _base64Media,
          );
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(
        () => _error = e.statusCode == 403
            ? 'You can review products after you have purchased them.'
            : e.message,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        0,
        20,
        20 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Rate this product', style: context.text.titleLarge),
          const SizedBox(height: 4),
          Text(
            widget.product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: context.text.bodySmall,
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 1; i <= 5; i++)
                IconButton(
                  tooltip: '$i star${i > 1 ? 's' : ''}',
                  iconSize: 36,
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    setState(() => _rating = i);
                  },
                  icon: Icon(
                    i <= _rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: i <= _rating
                        ? const Color(0xFFF5A623)
                        : context.palette.mutedText,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _comment,
            minLines: 3,
            maxLines: 5,
            maxLength: 1000,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              hintText: 'What did you like or dislike?',
            ),
          ),
          const SizedBox(height: 8),

          // Photo & Video Attach Buttons
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: _saving || _processingMedia ? null : () => _showMediaSourceOptions(false),
                icon: const Icon(Icons.add_a_photo_outlined, size: 18, color: AppTheme.peacockBlue),
                label: const Text('Add Photo', style: TextStyle(color: AppTheme.peacockBlue, fontSize: 13)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: Size.zero,
                  side: BorderSide(color: AppTheme.peacockBlue.withOpacity(0.3)),
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton.icon(
                onPressed: _saving || _processingMedia ? null : () => _showMediaSourceOptions(true),
                icon: const Icon(Icons.videocam_outlined, size: 18, color: AppTheme.peacockBlue),
                label: const Text('Add Video', style: TextStyle(color: AppTheme.peacockBlue, fontSize: 13)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: Size.zero,
                  side: BorderSide(color: AppTheme.peacockBlue.withOpacity(0.3)),
                ),
              ),
            ],
          ),

          if (_processingMedia) ...[
            const SizedBox(height: 8),
            const Row(
              children: [
                SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.peacockBlue)),
                SizedBox(width: 8),
                Text('Processing media file...', style: TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ],

          if (_selectedFile != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.peacockBlue.withOpacity(0.3)),
                        color: Colors.grey.shade100,
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: _isVideo
                          ? const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.play_circle_fill, color: AppTheme.peacockBlue, size: 28),
                                SizedBox(height: 2),
                                Text('Video', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            )
                          : FutureBuilder<Uint8List>(
                              future: _selectedFile!.readAsBytes(),
                              builder: (context, snapshot) {
                                if (snapshot.hasData) {
                                  return Image.memory(snapshot.data!, fit: BoxFit.cover);
                                }
                                return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                              },
                            ),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _selectedFile = null;
                          _base64Media = null;
                          _isVideo = false;
                        }),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close, color: Colors.white, size: 14),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _isVideo ? 'Video attached' : 'Photo attached',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.peacockBlue),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 12),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                _error!,
                style: TextStyle(color: context.colors.error),
              ),
            ),
          FilledButton(
            onPressed: _saving || _processingMedia ? null : _submit,
            child: _saving
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.4),
                  )
                : const Text('Submit review'),
          ),
        ],
      ),
    );
  }
}

class _BuyBar extends StatelessWidget {
  const _BuyBar({
    required this.inStock,
    required this.inCart,
    required this.loading,
    required this.onAdd,
    required this.onBuy,
  });

  final bool inStock;
  final bool inCart;
  final bool loading;
  final VoidCallback onAdd;
  final VoidCallback onBuy;

  @override
  Widget build(BuildContext context) {
    Widget half({
      required Widget child,
      required Color bg,
      required VoidCallback? onTap,
    }) => Expanded(
      child: Material(
        color: bg,
        child: InkWell(
          onTap: onTap,
          child: SizedBox(height: 54, child: Center(child: child)),
        ),
      ),
    );
    TextStyle? label(Color c) => context.text.titleSmall?.copyWith(
      color: c,
      fontWeight: FontWeight.w700,
      fontSize: 15,
    );

    return Material(
      color: Colors.white,
      elevation: 12,
      shadowColor: Colors.black38,
      child: SafeArea(
        top: false,
        child: !inStock
            ? Container(
                height: 54,
                alignment: Alignment.center,
                color: const Color(0xFFE0E0E0),
                child: Text(
                  'Currently unavailable',
                  style: label(const Color(0xFF616161)),
                ),
              )
            : Row(
                children: [
                  half(
                    bg: Colors.white,
                    onTap: loading ? null : onAdd,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          inCart
                              ? Icons.shopping_cart_rounded
                              : Icons.shopping_cart_outlined,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          inCart ? 'Go to cart' : 'Add to cart',
                          style: label(const Color(0xFF212121)),
                        ),
                      ],
                    ),
                  ),
                  half(
                    bg: AppColors.cta,
                    onTap: loading ? null : onBuy,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 160),
                      child: loading
                          ? const SizedBox(
                              key: ValueKey('l'),
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.4,
                                color: Colors.white,
                              ),
                            )
                          : Row(
                              key: const ValueKey('t'),
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.bolt_rounded,
                                  color: Colors.white,
                                  size: 22,
                                ),
                                const SizedBox(width: 4),
                                Text('Buy now', style: label(Colors.white)),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _DetailSkeleton extends StatelessWidget {
  const _DetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Shimmer(
      child: SingleChildScrollView(
        physics: NeverScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(aspectRatio: 1, child: Skeleton(radius: 0)),
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Skeleton(height: 12, width: 120),
                  SizedBox(height: 12),
                  Skeleton(height: 22, width: double.infinity),
                  SizedBox(height: 8),
                  Skeleton(height: 22, width: 220),
                  SizedBox(height: 16),
                  Skeleton(height: 28, width: 160),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
