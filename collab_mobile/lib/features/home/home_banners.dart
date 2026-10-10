import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/category_icons.dart';
import '../../data/models/store_settings.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/shimmer.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_gate.dart';
import '../catalog/catalog_providers.dart';

/// Gradients and copy mirror the website's top promo carousel
/// (EcommerceMarketplace.js): one slide per coupon, then Refer & Earn.
const _orangePink = LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEC4899)]);
const _blueIndigo = LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF4F46E5)]);
const _orangeRose = LinearGradient(colors: [Color(0xFFF97316), Color(0xFFF43F5E)]);
const _violetFuchsia = LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFC026D3)]);

const _referMessages = [
  'Login and earn upto 10% made by your friend.',
  'Refer, Re-Refer & Earn — Manage all in one place.',
  'Referral and redeem — earn more, spend smart.',
];

class HeroCarousel extends StatefulWidget {
  const HeroCarousel({super.key, required this.settings});
  final StoreSettings settings;

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  final _page = PageController();
  Timer? _timer;
  int _index = 0;

  int get _count => (widget.settings.coupons.isEmpty ? 1 : widget.settings.coupons.length) + 1;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_page.hasClients || _count < 2) return;
      if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return;
      _page.animateToPage((_index + 1) % _count, duration: const Duration(milliseconds: 500), curve: Curves.easeOutCubic);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.settings;
    final slides = <Widget>[
      if (s.coupons.isEmpty)
        _WelcomeSlide(settings: s)
      else
        for (var i = 0; i < s.coupons.length; i++) _CouponSlide(coupon: s.coupons[i], index: i),
      const _ReferSlide(),
    ];
    final wide = MediaQuery.sizeOf(context).width >= 720;

    return ColoredBox(
      color: Colors.white,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: SizedBox(
                height: wide ? 270 : 225,
                child: PageView(
                  controller: _page,
                  onPageChanged: (i) => setState(() => _index = i),
                  children: slides,
                ),
              ),
            ),
          ),
          if (slides.length > 1)
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < slides.length; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: i == _index ? 16 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: i == _index ? context.colors.primary : context.colors.outlineVariant,
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
}

class HeroSkeleton extends StatelessWidget {
  const HeroSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const ColoredBox(
        color: Colors.white,
        child: Shimmer(
          child: Padding(
            padding: EdgeInsets.fromLTRB(12, 4, 12, 16),
            child: Skeleton(height: 225, radius: 20),
          ),
        ),
      );
}

class _BlinkingStar extends StatefulWidget {
  const _BlinkingStar({required this.size, required this.duration, required this.offset});
  final double size;
  final Duration duration;
  final Duration offset;

  @override
  State<_BlinkingStar> createState() => _BlinkingStarState();
}

class _BlinkingStarState extends State<_BlinkingStar> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration);
    Future.delayed(widget.offset, () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: FadeTransition(
        opacity: Tween<double>(begin: 0.1, end: 0.9).animate(_ctrl),
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.6, end: 1.0).animate(_ctrl),
          child: Icon(Icons.star_rounded, color: Colors.white.withValues(alpha: 0.8), size: widget.size),
        ),
      ),
    );
  }
}

/// Shared slide frame: gradient, copy on the left, artwork on the right.
class _SlideFrame extends StatelessWidget {
  const _SlideFrame({required this.gradient, required this.badge, required this.badgeIcon, required this.text, required this.art});

  final Gradient gradient;
  final String badge;
  final IconData badgeIcon;
  final Widget text;
  final Widget art;

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 720;
    return DecoratedBox(
      decoration: BoxDecoration(gradient: gradient),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          const Positioned(top: 20, left: 160, child: _BlinkingStar(size: 16, duration: Duration(milliseconds: 1200), offset: Duration(milliseconds: 0))),
          const Positioned(bottom: 30, left: 130, child: _BlinkingStar(size: 12, duration: Duration(milliseconds: 1500), offset: Duration(milliseconds: 400))),
          const Positioned(top: 40, right: 30, child: _BlinkingStar(size: 20, duration: Duration(milliseconds: 1800), offset: Duration(milliseconds: 800))),
          const Positioned(bottom: 20, right: 100, child: _BlinkingStar(size: 14, duration: Duration(milliseconds: 1400), offset: Duration(milliseconds: 200))),
          Positioned.fill(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 0, 12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(badgeIcon, size: 12, color: const Color(0xFFFDE047)),
                              const SizedBox(width: 5),
                              Flexible(
                                child: Text(
                                  badge.toUpperCase(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        text,
                      ],
                    ),
                  ),
                ),
                SizedBox(
                  width: wide ? 280 : 170,
                  height: double.infinity,
                  child: art,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SlideButton extends StatelessWidget {
  const _SlideButton({required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      style: FilledButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        minimumSize: const Size(0, 34),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        shape: const StadiumBorder(),
        elevation: 4,
        shadowColor: Colors.black38,
        textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2),
      ),
      onPressed: onPressed,
      child: Text(label.toUpperCase()),
    );
  }
}

class _ArtImage extends StatelessWidget {
  const _ArtImage({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Align(
        alignment: Alignment.bottomRight,
        child: FractionallySizedBox(
          heightFactor: 1.05,
          alignment: Alignment.bottomRight,
          child: Padding(
            padding: const EdgeInsets.only(right: 2),
            child: child,
          ),
        ),
      );
}

class _CouponSlide extends ConsumerWidget {
  const _CouponSlide({required this.coupon, required this.index});

  final Coupon coupon;
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final even = index.isEven;
    // Same image precedence as the website: admin image, linked product, bundled artwork.
    final productId = coupon.productId;
    final product = (coupon.image.isEmpty && productId != null) ? ref.watch(productProvider(productId)).value : null;
    final remote = coupon.image.isNotEmpty ? coupon.image : (product?.image ?? '');
    final asset = even ? 'assets/images/ecommerce_products_collage.png' : 'assets/images/wow_person_offer.png';

    void apply() {
      ref.read(pendingCouponProvider.notifier).set(coupon.code);
      Clipboard.setData(ClipboardData(text: coupon.code));
      showAppSnack(
        context,
        '${coupon.code} will be applied at checkout',
        action: SnackBarAction(label: 'VIEW BAG', onPressed: () => context.go('/cart')),
      );
      if (product != null) context.push('/product/${product.id}');
    }

    return _SlideFrame(
      gradient: even ? _orangePink : _blueIndigo,
      badge: 'Mega Savings Festival',
      badgeIcon: Icons.bolt_rounded,
      text: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${coupon.discountPercent.round()}% OFF',
            maxLines: 1,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w900,
              height: 1,
              letterSpacing: -0.5,
              shadows: [Shadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 1))],
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Premium Collection',
            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            'USE CODE  ${coupon.code}',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          _SlideButton(label: product != null ? 'Shop Now' : 'Apply Now', onPressed: apply),
        ],
      ),
      art: _ArtImage(
        child: remote.isNotEmpty
            ? AppImage(remote, fit: BoxFit.contain, cacheWidth: 360, semanticLabel: 'Promotion')
            : Image.asset(asset, fit: BoxFit.contain, alignment: Alignment.bottomRight, semanticLabel: 'Promotion'),
      ),
    );
  }
}

class _WelcomeSlide extends StatelessWidget {
  const _WelcomeSlide({required this.settings});
  final StoreSettings settings;

  @override
  Widget build(BuildContext context) {
    final headline = settings.heroHeadline.isNotEmpty ? settings.heroHeadline : 'Shop smarter with Collabo';
    return _SlideFrame(
      gradient: _orangeRose,
      badge: 'Welcome Offer',
      badgeIcon: Icons.auto_awesome_rounded,
      text: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            headline.toUpperCase(),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, height: 1.1),
          ),
          const SizedBox(height: 6),
          const Text(
            'Join today for benefits',
            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          _SlideButton(label: 'Explore', onPressed: () => context.push('/products?title=All%20products')),
        ],
      ),
      art: _ArtImage(child: Image.asset('assets/images/ecommerce_products_collage.png', fit: BoxFit.contain, alignment: Alignment.bottomRight)),
    );
  }
}

class _ReferSlide extends ConsumerStatefulWidget {
  const _ReferSlide();

  @override
  ConsumerState<_ReferSlide> createState() => _ReferSlideState();
}

class _ReferSlideState extends ConsumerState<_ReferSlide> {
  Timer? _timer;
  int _message = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted) setState(() => _message = (_message + 1) % _referMessages.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _invite() async {
    if (!await ensureSignedIn(context, ref, reason: 'Sign in to invite friends')) return;
    final code = ref.read(currentUserProvider)?.affiliateCode ?? '';
    if (!mounted) return;
    if (code.isEmpty) {
      context.go('/account');
      return;
    }
    Clipboard.setData(ClipboardData(text: code));
    showAppSnack(context, 'Invite code $code copied. Share it to earn rewards.');
  }

  @override
  Widget build(BuildContext context) {
    return _SlideFrame(
      gradient: _violetFuchsia,
      badge: 'Refer & Earn',
      badgeIcon: Icons.card_giftcard_rounded,
      text: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'EARN UPTO 10%',
            maxLines: 1,
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, height: 1),
          ),
          const SizedBox(height: 6),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: Text(
              _referMessages[_message],
              key: ValueKey(_message),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800, height: 1.25),
            ),
          ),
          const SizedBox(height: 8),
          _SlideButton(label: 'Invite Friends', onPressed: _invite),
        ],
      ),
      art: Align(
        alignment: Alignment.bottomRight,
        child: FractionallySizedBox(
          heightFactor: 0.70,
          alignment: Alignment.bottomRight,
          child: Padding(
            padding: const EdgeInsets.only(right: 8, bottom: 16),
            child: SvgPicture.asset('assets/images/refer-earn-girl.svg', fit: BoxFit.contain, alignment: Alignment.bottomRight, semanticsLabel: 'Refer and earn'),
          ),
        ),
      ),
    );
  }
}

/// The website's category row: a thin line icon with a small tilted orange
/// square behind it, label underneath.
class CategoryIconRow extends ConsumerWidget {
  const CategoryIconRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);
    final images = ref.watch(storeSettingsProvider).value?.categoryImages ?? const {};

    return SizedBox(
      height: 104,
      child: categories.when(
        data: (list) => ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          scrollDirection: Axis.horizontal,
          itemCount: list.length + 1,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            if (i == 0) {
              return CategoryIconTile(
                name: 'All',
                onTap: () => context.push('/products?title=All%20products'),
              );
            }
            final c = list[i - 1];
            return CategoryIconTile(
              name: c.name,
              image: images[c.name],
              emoji: c.icon,
              onTap: () => context.push(
                '/products?category=${Uri.encodeQueryComponent(c.name)}&title=${Uri.encodeQueryComponent(c.name)}',
              ),
            );
          },
        ),
        loading: () => Shimmer(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            scrollDirection: Axis.horizontal,
            itemCount: 8,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (_, _) => const Column(
              children: [Skeleton(width: 56, height: 56, radius: 28), SizedBox(height: 6), Skeleton(width: 48, height: 9)],
            ),
          ),
        ),
        error: (e, _) => Center(
          child: TextButton.icon(
            onPressed: () => ref.invalidate(categoriesProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry loading categories'),
          ),
        ),
      ),
    );
  }
}

class CategoryIconTile extends StatelessWidget {
  const CategoryIconTile({super.key, required this.name, required this.onTap, this.image, this.emoji});

  final String name;
  final String? emoji;
  final String? image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasImage = image != null && image!.trim().isNotEmpty;
    return Semantics(
      button: true,
      label: 'Category $name',
      excludeSemantics: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 68, maxWidth: 76),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 44,
                height: 44,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Transform.rotate(
                        angle: 12 * math.pi / 180,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(5),
                          ),
                        ),
                      ),
                    ),
                    if (hasImage)
                      AppImage(image!, width: 44, height: 44, fit: BoxFit.contain, cacheWidth: 100)
                    else if (!CategoryIcons.has(name) && emoji != null && emoji!.trim().isNotEmpty)
                      Text(emoji!, style: const TextStyle(fontSize: 26, height: 1))
                    else
                      Icon(CategoryIcons.of(name), size: 22, color: Colors.white),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.text.labelSmall?.copyWith(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
