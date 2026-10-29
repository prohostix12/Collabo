import 'package:flutter/rendering.dart' show RenderAbstractViewport;
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/product.dart';
import '../../data/models/store_settings.dart';
import '../../shared/widgets/animated_wallet_button.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/product_widgets.dart';
import '../../shared/widgets/state_views.dart';
import '../../shared/widgets/visual_search.dart';
import '../account/account_providers.dart';
import '../account/location_picker_screen.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_gate.dart';
import '../catalog/catalog_providers.dart';
import '../notifications/notifications_provider.dart';
import '../../data/models/address.dart';
import 'home_banners.dart';
import 'home_extras.dart';
import 'home_feed.dart';
import 'home_sections.dart';

const _newest = ProductQuery(sort: ProductSort.newest);

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with SingleTickerProviderStateMixin {
  final _scroll = ScrollController();
  final _stripMarker = GlobalKey();

  /// 0 while the compact category-name row is showing under the search bar,
  /// 1 once the category photo strip has reached the top and taken over.
  late final AnimationController _hideNames = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 180),
  );
  String? _tab;

  ProductQuery get _feed => ProductQuery(category: _tab);

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 600) {
        ref.read(productListProvider(_feed).notifier).loadMore();
      }
      _syncCategoryNames();
    });
  }

  /// Hides the category-name row when the photo strip is about to pin under it.
  void _syncCategoryNames() {
    final ro = _stripMarker.currentContext?.findRenderObject();
    if (ro == null || !_scroll.hasClients) return;
    final viewport = RenderAbstractViewport.maybeOf(ro);
    if (viewport == null) return;
    final markerOffset = viewport.getOffsetToReveal(ro, 0).offset;
    final top = MediaQuery.paddingOf(context).top;
    final reached = _scroll.offset >= markerOffset - (_HomeHeaderDelegate.baseMin(top) + _HomeHeaderDelegate.namesHeight);
    if (reached && _hideNames.status != AnimationStatus.forward && _hideNames.value < 1) {
      _hideNames.forward();
    } else if (!reached && _hideNames.status != AnimationStatus.reverse && _hideNames.value > 0) {
      _hideNames.reverse();
    }
  }

  @override
  void dispose() {
    _hideNames.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(storeSettingsProvider);
    ref.invalidate(categoriesProvider);
    ref.invalidate(curatedProductsProvider);
    ref.invalidate(productShelfProvider);
    ref.invalidate(productPoolProvider);
    ref.invalidate(brandsProvider);
    await Future.wait([
      ref.refresh(productListProvider(_feed).future),
      ref.read(storeSettingsProvider.future),
    ]).catchError((_) => <Object>[]);
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(storeSettingsProvider);
    final feed = ref.watch(productListProvider(_feed));
    final s = settings.value;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        edgeOffset: 110,
        child: CustomScrollView(
          controller: _scroll,
          slivers: [
            SliverPersistentHeader(
              pinned: true,
              delegate: _HomeHeaderDelegate(
                topPadding: MediaQuery.paddingOf(context).top,
                hide: _hideNames.value,
              ),
            ),
            SliverToBoxAdapter(

              child: settings.when(
                data: (s) => HeroCarousel(settings: s),
                loading: () => const HeroSkeleton(),
                error: (_, _) => const HeroCarousel(settings: StoreSettings.fallback),
              ),
            ),
            const SliverToBoxAdapter(child: GreetingResume()),
            _CuratedShelf(
              section: CuratedSection.deals,
              title: 'Deals of the Day',
              subtitle: 'Limited-time prices',
              countdown: s?.dealsCycleAnchor == null
                  ? null
                  : DealsCountdown(anchor: s!.dealsCycleAnchor!, cycleHours: s.dealsTimerHours),
            ),
            const SliverToBoxAdapter(child: TopDealsRevealed()),
            SliverToBoxAdapter(child: TrustStrip(freeShippingThreshold: s?.freeShippingThreshold ?? 499)),
            const SliverToBoxAdapter(child: PopularBrands()),
            const SliverToBoxAdapter(child: TopCategoryCards()),
            const _CuratedShelf(section: CuratedSection.trending, title: 'Trending Products', subtitle: 'What shoppers love'),
            const SliverToBoxAdapter(child: CategorySpotlights()),
            const SliverToBoxAdapter(child: BudgetStore()),
            SliverToBoxAdapter(
              child: TrendingPhones(
                title: (s?.trendingPhonesTitle.isNotEmpty ?? false) ? s!.trendingPhonesTitle : 'Trending Phones',
                subtitle: s?.trendingPhonesSubtitle,
              ),
            ),
            _CuratedShelf(
              section: CuratedSection.weeklyDeals,
              title: 'Upcoming Weekly Deals',
              subtitle: 'Resets on the timer',
              countdown: s?.weeklyDealsCycleAnchor == null
                  ? null
                  : DealsCountdown(anchor: s!.weeklyDealsCycleAnchor!, cycleHours: s.weeklyDealsTimerHours),
            ),
            const SliverToBoxAdapter(child: PopularPicks()),
            if (s != null && s.coupons.isNotEmpty) SliverToBoxAdapter(child: _CouponStrip(coupons: s.coupons)),
            const SliverToBoxAdapter(child: JewelleryShowcase()),
            const _QueryShelf(query: _newest, title: 'Just Landed', heroPrefix: 'new', sort: 'newest'),
            SliverToBoxAdapter(child: SizedBox(key: _stripMarker, height: 0)),
            SliverPersistentHeader(
              pinned: true,
              delegate: FeedTabsDelegate(
                tabs: ref.watch(feedTabsProvider),
                selected: _tab,
                onSelect: (key) {
                  if (key == _tab) return;
                  HapticFeedback.selectionClick();
                  setState(() => _tab = key);
                },
              ),
            ),
            ...feed.when(
              data: (page) => [
                SliverProductGrid(products: page.items, heroPrefix: 'feed'),
                SliverToBoxAdapter(
                  child: LoadMoreFooter(
                    loading: page.loadingMore,
                    error: page.loadMoreError,
                    onRetry: () => ref.read(productListProvider(_feed).notifier).loadMore(),
                  ),
                ),
              ],
              loading: () => [const SliverProductGridSkeleton()],
              error: (e, _) => [
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 320,
                    child: ErrorView(error: e, compact: true, onRetry: () => ref.invalidate(productListProvider(_feed))),
                  ),
                ),
              ],
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

/// Pinned header: logo row, location bar, search bar, then the category icon row which
/// collapses into a one-line row of category names as the page scrolls.
class _HomeHeaderDelegate extends SliverPersistentHeaderDelegate {
  _HomeHeaderDelegate({required this.topPadding, required this.hide});

  final double topPadding;

  /// 0..1: how far the category-name row has been tucked away.
  final double hide;

  static const toolbarHeight = 44.0;
  static const locationHeight = 28.0;
  static const searchHeight = 52.0;
  static const iconsHeight = 110.0;
  static const namesHeight = 34.0;
  static const sheetHeaderHeight = 16.0;

  static double baseMin(double top) => top + toolbarHeight + locationHeight + searchHeight + sheetHeaderHeight;

  @override
  double get maxExtent => baseMin(topPadding) + iconsHeight;
  @override
  double get minExtent => baseMin(topPadding) + namesHeight * (1 - hide);

  @override
  bool shouldRebuild(_HomeHeaderDelegate old) => old.topPadding != topPadding || old.hide != hide;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final extent = (maxExtent - shrinkOffset).clamp(minExtent, maxExtent);
    final area = (extent - baseMin(topPadding)).clamp(0.0, iconsHeight);
    // 0 = fully expanded, 1 = collapsed to the names row.
    final t = ((iconsHeight - area) / (iconsHeight - namesHeight)).clamp(0.0, 1.0);
    final iconsOpacity = (1 - t * 1.8).clamp(0.0, 1.0);
    final namesOpacity = ((t * 1.8 - 0.8).clamp(0.0, 1.0)) * (1 - hide);

    return SizedBox(
      height: extent,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFB800FF), Color(0xFF0044FF), Color(0xFF3B00BA)],
                stops: [0.0, 0.4, 1.0],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          const _HeaderLightEffectWidget(),
          Padding(
            padding: EdgeInsets.only(top: topPadding, bottom: sheetHeaderHeight),
            child: Column(
              children: [
                const SizedBox(height: toolbarHeight, child: _HomeToolbar()),
                const SizedBox(height: locationHeight, child: _HomeLocationBar()),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                  child: _SearchBarButton(onTap: () => context.push('/search')),
                ),
                Expanded(
                  child: ClipRect(
                    child: Stack(
                      children: [
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: iconsHeight,
                          child: IgnorePointer(
                            ignoring: iconsOpacity < 0.5,
                            child: Opacity(opacity: iconsOpacity, child: const CategoryIconRow()),
                          ),
                        ),
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: namesHeight,
                          child: IgnorePointer(
                            ignoring: namesOpacity < 0.5,
                            child: Opacity(opacity: namesOpacity, child: const CategoryNamesRow()),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: -1,
            left: 0,
            right: 0,
            height: sheetHeaderHeight + 1,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeToolbar extends ConsumerWidget {
  const _HomeToolbar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(isLoggedInProvider);
    final unread = loggedIn ? ref.watch(unreadNotificationsProvider) : 0;
    final balance = loggedIn ? (ref.watch(walletProvider).value?.balance ?? 0) : 0.0;
    return Row(
      children: [
        const SizedBox(width: 12),
        const BrandLogo(height: 22),
        const Spacer(),
        AnimatedWalletButton(
          balance: balance,
          label: loggedIn ? null : 'Earn',
          onPressed: () async {
            if (!await ensureSignedIn(context, ref, reason: 'Sign in to see your referral wallet')) return;
            if (context.mounted) context.push('/wallet');
          },
        ),
        IconButton(
          tooltip: unread > 0 ? 'Notifications, $unread new' : 'Notifications',
          onPressed: () => context.push('/notifications'),
          icon: Badge(
            isLabelVisible: unread > 0,
            label: Text('$unread'),
            backgroundColor: AppColors.accentYellow,
            textColor: Colors.black87,
            child: const Icon(Icons.notifications_none_rounded, color: Colors.white),
          ),
        ),
        IconButton(
          tooltip: 'Cart',
          onPressed: () => context.go('/cart'),
          icon: const Icon(Icons.shopping_cart_outlined, color: Colors.white),
        ),
        const SizedBox(width: 4),
      ],
    );
  }
}

/// One-line, text-only category row shown under the search bar once the
/// icon row has scrolled away.
class CategoryNamesRow extends ConsumerWidget {
  const CategoryNamesRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = ref.watch(categoriesProvider).value ?? const <Category>[];
    final names = <(String, String?)>[('All', null), for (final c in cats) (c.name, c.name)];
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: names.length,
      separatorBuilder: (_, _) => const SizedBox(width: 6),
      itemBuilder: (context, i) {
        final (label, key) = names[i];
        return InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => context.push(
            key == null
                ? '/products?title=All%20products'
                : '/products?category=${Uri.encodeQueryComponent(key)}&title=${Uri.encodeQueryComponent(key)}',
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Center(
              child: Text(
                label,
                maxLines: 1,
                style: const TextStyle(color: Colors.white, fontSize: 13.5, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _HeaderLightEffectWidget extends StatefulWidget {
  const _HeaderLightEffectWidget();

  @override
  State<_HeaderLightEffectWidget> createState() => _HeaderLightEffectWidgetState();
}

class _HeaderLightEffectWidgetState extends State<_HeaderLightEffectWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    // 6.0s total cycle for the beam (very slow), while others loop every 3.0s
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 6000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return ClipRect(
            child: CustomPaint(
              painter: _HeaderLightPainter(progress: _controller.value),
            ),
          );
        },
      ),
    );
  }
}

class _StarSeed {
  final double nx;
  final double ny;
  final double speed;
  final double phase;
  final bool isCross;

  const _StarSeed(this.nx, this.ny, this.speed, this.phase, this.isCross);
}

class _HeaderLightPainter extends CustomPainter {
  final double progress;

  _HeaderLightPainter({required this.progress});

  // Ambient twinkling stars distributed across the header background
  static const List<_StarSeed> _stars = [
    _StarSeed(0.06, 0.18, 1.1, 0.4, true),
    _StarSeed(0.14, 0.12, 0.9, 2.1, false),
    _StarSeed(0.24, 0.24, 1.3, 4.0, true),
    _StarSeed(0.38, 0.14, 1.0, 1.5, false),
    _StarSeed(0.50, 0.20, 1.4, 3.7, true),
    _StarSeed(0.65, 0.12, 0.8, 0.9, false),
    _StarSeed(0.80, 0.18, 1.2, 5.2, true),
    _StarSeed(0.92, 0.15, 1.0, 2.8, false),
    _StarSeed(0.05, 0.58, 1.2, 3.1, true),
    _StarSeed(0.18, 0.48, 0.9, 0.7, false),
    _StarSeed(0.28, 0.64, 1.4, 4.5, true),
    _StarSeed(0.42, 0.52, 1.1, 1.9, false),
    _StarSeed(0.55, 0.60, 1.3, 5.8, true),
    _StarSeed(0.68, 0.46, 0.8, 2.4, false),
    _StarSeed(0.82, 0.56, 1.2, 0.3, true),
    _StarSeed(0.94, 0.48, 1.5, 3.9, false),
    _StarSeed(0.10, 0.85, 1.0, 1.2, true),
    _StarSeed(0.25, 0.90, 1.3, 4.9, false),
    _StarSeed(0.45, 0.84, 0.9, 2.6, true),
    _StarSeed(0.60, 0.88, 1.4, 0.1, false),
    _StarSeed(0.75, 0.82, 1.1, 3.4, true),
    _StarSeed(0.88, 0.88, 1.2, 5.0, false),
  ];

  static Offset _getPosition(double t, Size size) {
    // Smoother Lissajous curve movement instead of sharp linear ping-pong bounces
    final double x = 0.5 + 0.5 * math.sin(t * math.pi * 4.0 + 0.3);
    final double y = 0.5 + 0.5 * math.sin(t * math.pi * 5.0 + 0.8); // 5 instead of 6 for softer flow

    // Keep the center slightly inside the edges (12% to 88% of screen size)
    return Offset(
      (0.12 + 0.76 * x) * size.width,
      (0.12 + 0.76 * y) * size.height,
    );
  }

  static double _getHeading(double t, Size size) {
    const double dt = 0.005;
    final Offset pBefore = _getPosition(t - dt, size);
    final Offset pAfter = _getPosition(t + dt, size);
    return math.atan2(pAfter.dy - pBefore.dy, pAfter.dx - pBefore.dx);
  }

  @override
  void paint(Canvas canvas, Size size) {
    // To keep pataka and stars on a faster 2-second loop, we use a 3x speed local progress
    final double cycle3s = (progress * 3.0) % 1.0;

    // 1. Always paint ambient twinkling stars across entire background with gentle gap
    _drawAmbientBackgroundStars(canvas, size, progress);

    // Beam moves continuously, bouncing via pingPong math in _getPosition
    final double beamT = progress;

    // Master opacity: always fully visible (no disappearing at the edges)
    // Moderate intensity for softer appearance but distinct purple color
    double masterOpacity = 0.60;

    if (masterOpacity <= 0.001) return;

    final Offset currentPos = _getPosition(beamT, size);
    final double currentHeading = _getHeading(beamT, size);

    final Paint paint = Paint()..style = PaintingStyle.fill;

    // 2. Soft Translucent Trail Following the Curved Path (Pure Flipkart Purple, No Blue)
    for (int i = 4; i >= 1; i--) {
      final double trailT = beamT - (i * 0.045);
      final Offset trailPos = _getPosition(trailT, size);
      final double trailHeading = _getHeading(trailT, size);
      final double trailOpacity = masterOpacity * (1.0 - (i * 0.22));

      if (trailOpacity > 0.01) {
        // Increased size slightly more
        final double trailRadius = size.height * (0.50 - (i * 0.04));
        final Path trailBlob = _createAmorphousPath(
          center: trailPos,
          baseRadius: trailRadius,
          t: trailT,
          heading: trailHeading,
          seed: i * 1.6,
        );

        paint.shader = RadialGradient(
          colors: [
            const Color(0xFFD500F9).withValues(alpha: (trailOpacity * 0.70).clamp(0.0, 1.0)),
            const Color(0xFFB800FF).withValues(alpha: (trailOpacity * 0.35).clamp(0.0, 1.0)),
            const Color(0xFF8A00E6).withValues(alpha: 0.0),
          ],
          stops: const [0.0, 0.40, 1.0],
        ).createShader(Rect.fromCircle(center: trailPos, radius: trailRadius));

        canvas.drawPath(trailBlob, paint);
      }
    }

    // 3. Outer Radiant Purple Glow (Exact Flipkart Electric Purple, No Blue)
    final double outerRadius = size.height * 0.68;
    final Path outerBlob = _createAmorphousPath(
      center: currentPos,
      baseRadius: outerRadius,
      t: beamT,
      heading: currentHeading,
      seed: 0.0,
    );

    paint.shader = RadialGradient(
      colors: [
        const Color(0xFFD500F9).withValues(alpha: (masterOpacity * 0.65).clamp(0.0, 1.0)),
        const Color(0xFFB800FF).withValues(alpha: (masterOpacity * 0.30).clamp(0.0, 1.0)),
        const Color(0xFF7B1FA2).withValues(alpha: 0.0),
      ],
      stops: const [0.0, 0.45, 1.0],
    ).createShader(Rect.fromCircle(center: currentPos, radius: outerRadius));

    canvas.drawPath(outerBlob, paint);

    // 4. Main Intense Electric Purple/Magenta Glowing Core (No Blue)
    final double coreRadius = size.height * 0.52;
    final Path coreBlob = _createAmorphousPath(
      center: currentPos,
      baseRadius: coreRadius,
      t: beamT,
      heading: currentHeading,
      seed: 2.8,
    );

    paint.shader = RadialGradient(
      colors: [
        const Color(0xFFD500F9).withValues(alpha: (masterOpacity * 0.75).clamp(0.0, 1.0)),
        const Color(0xFFB800FF).withValues(alpha: (masterOpacity * 0.35).clamp(0.0, 1.0)),
        const Color(0xFFA000F0).withValues(alpha: 0.0),
      ],
      stops: const [0.0, 0.40, 1.0],
    ).createShader(Rect.fromCircle(center: currentPos, radius: coreRadius));

    canvas.drawPath(coreBlob, paint);

    // Removed the highly concentrated "Center Core Light" 
    // to maintain a uniform intensity throughout the entire beam.

    // 6. Pataka Firecracker Lines:
    // Only shows once every 3 seconds (using cycle3s).
    // Movement is slow (takes 1.8 seconds out of the 3.0s cycle).
    final double burstProgress = cycle3s <= 0.60 ? (cycle3s / 0.60) : 1.0;
    _drawPatakaLines(canvas, size, burstProgress);

    // 7. Small Sparkle Micro Particles orbiting moving light (no star in center of beam)
    _drawSparkleParticles(canvas, currentPos, size, beamT, masterOpacity);
  }

  // Draw ambient twinkling stars across entire background with slow appear and fast disappear
  void _drawAmbientBackgroundStars(Canvas canvas, Size size, double progress) {
    final starDotPaint = Paint()..style = PaintingStyle.fill;
    final starCrossPaint = Paint()..style = PaintingStyle.fill;

    for (int i = 0; i < _stars.length; i++) {
      final star = _stars[i];
      // Different blink rates (integer multiples so it loops perfectly over progress 0->1)
      final int blinkCycles = 3 + (i % 5); // 3, 4, 5, 6, or 7 blinks per full 6s animation cycle
      final double localP = (progress * blinkCycles + (star.phase / 6.0)) % 1.0;
      
      double starAlpha = 0.0;
      if (localP <= 0.85) {
        // Slow appear
        starAlpha = Curves.easeInOutSine.transform(localP / 0.85);
      } else {
        // Fast disappear
        starAlpha = 1.0 - ((localP - 0.85) / 0.15);
      }
      
      if (starAlpha <= 0.01) continue;

      // Slow drift so they don't stay in the exact same spot (loops perfectly)
      final double driftX = 0.03 * math.sin(progress * 2 * math.pi * 2.0 + star.phase);
      final double driftY = 0.03 * math.cos(progress * 2 * math.pi * 3.0 + star.phase);
      final Offset pos = Offset((star.nx + driftX) * size.width, (star.ny + driftY) * size.height);

      if (star.isCross) {
        starCrossPaint.color = Colors.white.withValues(alpha: (starAlpha * 0.92).clamp(0.0, 1.0));
        _drawStarSparkle(canvas, pos, 2.5 + (2.5 * starAlpha), starCrossPaint);

        starCrossPaint.color = const Color(0xFFEA80FC).withValues(alpha: (starAlpha * 0.45).clamp(0.0, 1.0));
        _drawStarSparkle(canvas, pos, 3.5 + (3.0 * starAlpha), starCrossPaint);
      } else {
        starDotPaint.color = Colors.white.withValues(alpha: (starAlpha * 0.85).clamp(0.0, 1.0));
        canvas.drawCircle(pos, 1.2 + 0.8 * starAlpha, starDotPaint);
      }
    }
  }

  // Draw radiating firecracker spark lines ("pataka lines"):
  // Appears from center of top bg section, thin purple color, expands to section boundary and disappears.
  void _drawPatakaLines(
    Canvas canvas,
    Size size,
    double p,
  ) {
    if (p <= 0.0 || p >= 1.0) return;

    // Use easeInOutQuad so the lines start a little slowly before accelerating outwards
    final double headEased = Curves.easeInOutQuad.transform(p);
    final double tailEased = Curves.easeInCubic.transform(p);

    final double lineAlpha = (math.sin(p * math.pi)).clamp(0.0, 1.0);
    if (lineAlpha <= 0.02) return;

    final Paint glowPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;

    final Paint corePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9;

    // Appears from center of the top background purple-blue section (NOT from the beam)
    final Offset sectionCenter = Offset(size.width * 0.50, size.height * 0.45);

    // Moves all the way to the end/edges of the top purple-blue section
    final double maxDistance = math.sqrt(size.width * size.width + size.height * size.height) * 0.65;

    void drawSeg(double start, double end, double angle) {
      if (start >= end) return;
      final Offset p1 = Offset(
        sectionCenter.dx + start * math.cos(angle),
        sectionCenter.dy + start * math.sin(angle),
      );
      final Offset p2 = Offset(
        sectionCenter.dx + end * math.cos(angle),
        sectionCenter.dy + end * math.sin(angle),
      );
      glowPaint.color = const Color(0xFFD500F9).withValues(alpha: (lineAlpha * 0.60).clamp(0.0, 1.0));
      canvas.drawLine(p1, p2, glowPaint);

      corePaint.color = const Color(0xFFE040FF).withValues(alpha: (lineAlpha * 0.92).clamp(0.0, 1.0));
      canvas.drawLine(p1, p2, corePaint);
    }

    final int numRays = 16; // Increased number of pataka lines
    for (int i = 0; i < numRays; i++) {
      final double angle = (i * 2 * math.pi) / numRays + 0.15;
      final double totalLen = maxDistance * (i % 2 == 0 ? 1.0 : 0.65); // Alternating lengths
      final double innerGap = 40.0; // Empty gap in the center so lines don't meet

      final double headR = innerGap + (totalLen - innerGap) * headEased;
      double tailR = innerGap + (totalLen - innerGap) * math.max(0.0, (tailEased - 0.15) / 0.85);
      
      // Limit the maximum visible streak length so the lines appear shorter
      final double maxStreakLength = totalLen * 0.25; 
      if (headR - tailR > maxStreakLength) {
        tailR = headR - maxStreakLength;
      }

      if (headR <= tailR) continue;

      // One continuous line without gaps
      drawSeg(tailR, headR, angle);
    }
  }

  Path _createAmorphousPath({
    required Offset center,
    required double baseRadius,
    required double t,
    required double heading,
    required double seed,
  }) {
    final path = Path();
    const int numPoints = 10;
    final double angleStep = (2 * math.pi) / numPoints;

    for (int i = 0; i < numPoints; i++) {
      final double angle = i * angleStep;
      final double angleDiff = angle - heading;
      final double stretch = 1.0 + 0.20 * math.cos(2 * angleDiff);

      final double morph = stretch +
          0.16 * math.sin(t * 4 * math.pi + angle * 3 + seed) +
          0.10 * math.cos(t * 6 * math.pi - angle * 2 + seed);

      final double r = baseRadius * morph;
      final double px = center.dx + r * math.cos(angle);
      final double py = center.dy + r * math.sin(angle);

      if (i == 0) {
        path.moveTo(px, py);
      } else {
        path.lineTo(px, py);
      }
    }
    path.close();
    return path;
  }

  void _drawSparkleParticles(
    Canvas canvas,
    Offset center,
    Size size,
    double t,
    double masterOpacity,
  ) {
    final particlePaint = Paint()..style = PaintingStyle.fill;
    const int particleCount = 8;

    for (int i = 0; i < particleCount; i++) {
      final double pSeed = i * 1.45;
      final double angle = (i * (2 * math.pi / particleCount)) + (t * 2.8);
      final double distance = (size.height * 0.20) +
          (size.height * 0.08) * math.sin(t * 3 * math.pi + pSeed);
      final Offset pos = Offset(
        center.dx + distance * math.cos(angle),
        center.dy + distance * math.sin(angle),
      );

      final double pOpacity = (0.25 + 0.75 * math.sin(t * 4 * math.pi + pSeed))
          .clamp(0.0, 1.0) * masterOpacity * 0.9;

      if (pOpacity > 0.05) {
        // Micro purple glowing dots (no star in or near center of beam)
        particlePaint.color = const Color(0xFFE040FF).withValues(alpha: pOpacity.clamp(0.0, 1.0));
        canvas.drawCircle(pos, 1.4, particlePaint);
      }
    }
  }

  void _drawStarSparkle(Canvas canvas, Offset center, double radius, Paint paint) {
    final path = Path();
    path.moveTo(center.dx, center.dy - radius);
    path.quadraticBezierTo(center.dx, center.dy, center.dx + radius, center.dy);
    path.quadraticBezierTo(center.dx, center.dy, center.dx, center.dy + radius);
    path.quadraticBezierTo(center.dx, center.dy, center.dx - radius, center.dy);
    path.quadraticBezierTo(center.dx, center.dy, center.dx, center.dy - radius);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _HeaderLightPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class _SearchBarButton extends ConsumerWidget {
  const _SearchBarButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Semantics(
      button: true,
      label: 'Search products',
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        elevation: 1,
        child: InkWell(
          borderRadius: BorderRadius.circular(4),
          onTap: onTap,
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                const Icon(Icons.search_rounded, color: AppColors.peacock),
                const SizedBox(width: 10),
                Expanded(
                  child: Hero(
                    tag: 'search-field',
                    child: Material(
                      type: MaterialType.transparency,
                      child: Text(
                        'Search for products, brands and more',
                        style: context.text.bodyLarge?.copyWith(color: context.palette.mutedText),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Search by Image',
                  onPressed: () => VisualSearchHelper.startVisualSearch(context, ref),
                  icon: const Icon(Icons.camera_alt_outlined, color: AppColors.peacock, size: 20),
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}



class _CouponStrip extends StatelessWidget {
  const _CouponStrip({required this.coupons});
  final List<Coupon> coupons;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Offers for you', subtitle: 'Apply at checkout'),
        Container(
          color: Colors.white,
          height: 104,
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            scrollDirection: Axis.horizontal,
            itemCount: coupons.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final c = coupons[i];
              return Container(
                width: 250,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F9FF),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${c.discountPercent.round()}%',
                        style: context.text.titleSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c.code, style: context.text.titleSmall?.copyWith(letterSpacing: 1)),
                          Text(
                            c.description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Copy code ${c.code}',
                      icon: const Icon(Icons.copy_rounded, size: 18),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: c.code));
                        showAppSnack(context, 'Coupon ${c.code} copied');
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _CuratedShelf extends ConsumerWidget {
  const _CuratedShelf({required this.section, required this.title, this.subtitle, this.countdown});

  final CuratedSection section;
  final String title;
  final String? subtitle;
  final Widget? countdown;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(curatedProductsProvider(section));
    return SliverToBoxAdapter(
      child: products.when(
        data: (list) => list.isEmpty
            ? const SizedBox.shrink()
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SectionHeader(title: title, subtitle: subtitle, trailing: countdown),
                  ProductShelf(products: list, heroPrefix: section.name),
                ],
              ),
        loading: () => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [SectionHeader(title: title, subtitle: subtitle), const ProductShelfSkeleton()],
        ),
        // Curated shelves are optional; the rest of the page still works.
        error: (_, _) => const SizedBox.shrink(),
      ),
    );
  }
}

class _QueryShelf extends ConsumerWidget {
  const _QueryShelf({required this.query, required this.title, required this.heroPrefix, required this.sort});

  final ProductQuery query;
  final String title;
  final String heroPrefix;
  final String sort;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(productShelfProvider(query));
    final header = SectionHeader(
      title: title,
      onSeeAll: () => context.push('/products?sort=$sort&title=${Uri.encodeQueryComponent(title)}'),
    );
    return SliverToBoxAdapter(
      child: products.when(
        data: (list) => list.isEmpty
            ? const SizedBox.shrink()
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [header, ProductShelf(products: list, heroPrefix: heroPrefix)],
              ),
        loading: () => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [header, const ProductShelfSkeleton()],
        ),
        error: (_, _) => const SizedBox.shrink(),
      ),
    );
  }
}

class _HomeLocationBar extends ConsumerWidget {
  const _HomeLocationBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggedIn = ref.watch(isLoggedInProvider);
    final addressesState = isLoggedIn ? ref.watch(addressesProvider) : null;
    final customLocation = ref.watch(selectedDeliveryLocationProvider);

    String locationText = 'Select Delivery Location';
    if (customLocation != null) {
      locationText = customLocation.displayText;
    } else if (isLoggedIn && addressesState != null && addressesState.hasValue) {
      final list = addressesState.value ?? [];
      if (list.isNotEmpty) {
        final def = list.firstWhere((a) => a.isDefault, orElse: () => list.first);
        final name = def.name.split(' ').first;
        final city = def.city;
        final pin = def.postalCode;
        if (city.isNotEmpty || pin.isNotEmpty) {
          locationText = '$name - ${[city, pin].where((s) => s.isNotEmpty).join(' ')}';
        } else if (name.isNotEmpty) {
          locationText = name;
        }
      }
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _showLocationBottomSheet(context),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            children: [
              const Icon(
                Icons.location_on_rounded,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    children: [
                      const TextSpan(
                        text: 'Deliver to ',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      TextSpan(
                        text: locationText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 3),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Colors.white70,
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLocationBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _LocationSelectionBottomSheet(),
    );
  }
}

class _LocationSelectionBottomSheet extends ConsumerWidget {
  const _LocationSelectionBottomSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoggedIn = ref.watch(isLoggedInProvider);
    final addressesState = isLoggedIn ? ref.watch(addressesProvider) : null;
    final customLocation = ref.watch(selectedDeliveryLocationProvider);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 22),
              const SizedBox(width: 8),
              const Text(
                'Select Delivery Location',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, size: 20),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: () async {
              Navigator.pop(context);
              final res = await Navigator.push<LocationResult>(
                context,
                MaterialPageRoute(builder: (_) => const LocationPickerScreen()),
              );
              if (res != null) {
                ref.read(selectedDeliveryLocationProvider.notifier).select(DeliveryLocation(
                  title: res.city.isNotEmpty ? res.city : 'Current Location',
                  city: res.city,
                  pincode: res.postalCode,
                  fullAddress: res.fullFormatted,
                ));
              }
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                borderRadius: BorderRadius.circular(12),
                color: AppColors.primary.withOpacity(0.04),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Use Current Location (Map)',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Select on interactive map using GPS',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.primary),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (isLoggedIn) ...[
            const Text(
              'SAVED ADDRESSES',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black54,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            if (addressesState != null)
              addressesState.when(
                data: (addresses) {
                  if (addresses.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text(
                        'No saved addresses yet.',
                        style: TextStyle(color: Colors.black54, fontSize: 13),
                      ),
                    );
                  }
                  return Column(
                    children: addresses.map((addr) {
                      final isSelected = customLocation == null
                          ? addr.isDefault || addresses.first.id == addr.id
                          : customLocation.fullAddress == addr.singleLine;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: isSelected ? AppColors.primary : Colors.grey.shade200,
                            width: isSelected ? 1.5 : 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          color: isSelected ? AppColors.primary.withOpacity(0.02) : Colors.white,
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                          leading: Icon(
                            isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: isSelected ? AppColors.primary : Colors.grey,
                          ),
                          title: Text(
                            '${addr.name} (${addr.postalCode})',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            addr.singleLine,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: Colors.black87),
                          ),
                          onTap: () {
                            ref.read(selectedDeliveryLocationProvider.notifier).select(DeliveryLocation(
                              title: addr.name.split(' ').first,
                              city: addr.city,
                              pincode: addr.postalCode,
                              fullAddress: addr.singleLine,
                            ));
                            Navigator.pop(context);
                          },
                        ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                error: (_, __) => const SizedBox(),
              ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/addresses/edit');
                    },
                    icon: const Icon(Icons.add_location_alt_outlined, size: 18),
                    label: const Text('Add Address'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/addresses');
                    },
                    icon: const Icon(Icons.manage_accounts_outlined, size: 18),
                    label: const Text('Manage All'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: Colors.amber),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Log in to view your saved delivery addresses.',
                      style: TextStyle(fontSize: 13, color: Colors.black87),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push('/auth/login');
                    },
                    child: const Text('LOGIN', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

