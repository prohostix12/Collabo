import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

/// Animated gradient sweep shared by every [Skeleton] beneath it, so a screen
/// full of placeholders runs a single animation.
class Shimmer extends StatefulWidget {
  const Shimmer({super.key, required this.child});
  final Widget child;

  static ShimmerState? of(BuildContext context) => context.findAncestorStateOfType<ShimmerState>();

  @override
  State<Shimmer> createState() => ShimmerState();
}

class ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..repeat();

  Animation<double> get animation => _controller;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduceMotion) _controller.stop();
    return Semantics(label: 'Loading', child: ExcludeSemantics(child: widget.child));
  }
}

class Skeleton extends StatelessWidget {
  const Skeleton({super.key, this.width, this.height, this.radius = 10});

  final double? width;
  final double? height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final shimmer = Shimmer.of(context);
    final box = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: palette.shimmerBase,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
    if (shimmer == null) return box;
    return AnimatedBuilder(
      animation: shimmer.animation,
      builder: (context, child) {
        final t = shimmer.animation.value;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment(-1.0 + 3 * t - 1, -0.3),
            end: Alignment(-1.0 + 3 * t, 0.3),
            colors: [palette.shimmerBase, palette.shimmerHighlight, palette.shimmerBase],
            stops: const [0.1, 0.5, 0.9],
          ).createShader(bounds),
          child: child,
        );
      },
      child: box,
    );
  }
}
