import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/utils/formatters.dart';

/// Header wallet button that draws attention every [every]: the lid opens, the
/// icon turns teal, the balance pops out above it, drops back inside and the
/// icon returns to normal. Mirrors the website's navbar wallet.
class AnimatedWalletButton extends StatefulWidget {
  const AnimatedWalletButton({
    super.key,
    required this.balance,
    required this.onPressed,
    this.label,
    this.every = const Duration(seconds: 7),
  });

  final double balance;
  final VoidCallback onPressed;

  /// Text for the pop-out chip instead of the balance (e.g. "Earn" for guests,
  /// who have no balance yet).
  final String? label;
  final Duration every;

  @override
  State<AnimatedWalletButton> createState() => _AnimatedWalletButtonState();
}

class _AnimatedWalletButtonState extends State<AnimatedWalletButton> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000));
  Timer? _first;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _first = Timer(const Duration(milliseconds: 1500), _play);
    _timer = Timer.periodic(widget.every, (_) => _play());
  }

  void _play() {
    if (!mounted) return;
    if (MediaQuery.disableAnimationsOf(context)) return;
    _c.forward(from: 0);
  }

  @override
  void dispose() {
    _first?.cancel();
    _timer?.cancel();
    _c.dispose();
    super.dispose();
  }

  // Keyframe helper: 0..1 progress on [a, b], clamped.
  static double _seg(double t, double a, double b) => ((t - a) / (b - a)).clamp(0.0, 1.0);

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: widget.label == null ? 'Referral wallet, balance ${formatPrice(widget.balance)}' : 'Referral wallet',
      excludeSemantics: true,
      child: SizedBox(
        width: 48,
        height: 48,
        child: Material(
          type: MaterialType.transparency,
          child: InkResponse(
            onTap: widget.onPressed,
            radius: 24,
            child: AnimatedBuilder(
              animation: _c,
              builder: (context, _) {
                final t = _c.value;
                // 0 = resting, 1 = fully highlighted
                final glow = Curves.easeOut.transform(_seg(t, 0.0, 0.12)) *
                    (1 - Curves.easeIn.transform(_seg(t, 0.86, 1.0)));
                // lid: opens 0..12%, holds, closes 80..100%
                final lid = Curves.easeOutCubic.transform(_seg(t, 0.0, 0.12)) *
                    (1 - Curves.easeInOut.transform(_seg(t, 0.8, 0.96)));
                // chip: rises 12..30%, holds, drops 66..82%
                final rise = Curves.easeOutBack.transform(_seg(t, 0.12, 0.3));
                final drop = Curves.easeIn.transform(_seg(t, 0.66, 0.82));
                final chip = rise * (1 - drop);
                final color = Color.lerp(Colors.white, const Color(0xFF5EEAD4), glow)!;

                return Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    if (glow > 0)
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF14B8A6).withValues(alpha: 0.28 * glow),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2DD4BF).withValues(alpha: 0.5 * glow),
                              blurRadius: 12 * glow,
                            ),
                          ],
                        ),
                      ),
                    CustomPaint(size: const Size(24, 24), painter: _WalletPainter(color: color, lid: lid)),
                    if (chip > 0.01)
                      Positioned(
                        top: 15 - 14 * chip.clamp(0.0, 1.0),
                        child: Opacity(
                          opacity: chip.clamp(0.0, 1.0),
                          child: Transform.scale(
                            scale: (0.35 + 0.65 * chip).clamp(0.0, 1.12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF22C55E)]),
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                              ),
                              child: Text(
                                widget.label ?? formatPrice(widget.balance),
                                maxLines: 1,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  height: 1.2,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _WalletPainter extends CustomPainter {
  _WalletPainter({required this.color, required this.lid});

  final Color color;

  /// 0 = closed, 1 = fully open.
  final double lid;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.9 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // body
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(3 * s, 9 * s, 18 * s, 11 * s), Radius.circular(2.5 * s)), stroke);

    // lid, hinged at its bottom-left corner so it swings up when opening
    canvas.save();
    canvas.translate(3 * s, 9 * s);
    canvas.rotate(-lid * 32 * math.pi / 180);
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(0, -1.8 * s)
      ..arcToPoint(Offset(2.2 * s, -4 * s), radius: Radius.circular(2.2 * s))
      ..lineTo(14 * s, -4 * s);
    canvas.drawPath(path, stroke);
    canvas.restore();

    // clasp
    canvas.drawCircle(Offset(16.5 * s, 14.5 * s), 1.2 * s, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_WalletPainter old) => old.color != color || old.lid != lid;
}
