import 'package:flutter/material.dart';

class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.height = 24,
    this.showBackground = true,
  });

  final double height;
  final bool showBackground;

  @override
  Widget build(BuildContext context) {
    final logo = Image.asset(
      'assets/images/collabo-logo.png',
      height: height,
      semanticLabel: 'Collabo',
      filterQuality: FilterQuality.medium,
    );

    if (!showBackground) return logo;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 4,
            offset: const Offset(0, 1.5),
          ),
        ],
      ),
      child: logo,
    );
  }
}
