import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/connectivity.dart';
import '../../core/theme/app_theme.dart';

/// App-wide strip shown while the device has no connectivity.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offline = ref.watch(isOfflineProvider).value ?? false;
    final topInset = MediaQuery.paddingOf(context).top;
    return Stack(
      children: [
        child,
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          child: IgnorePointer(
            child: AnimatedSlide(
              offset: offline ? Offset.zero : const Offset(0, -1),
              duration: const Duration(milliseconds: 280),
              curve: Curves.easeOutCubic,
              child: Material(
                color: const Color(0xFF2B2533),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(16, topInset + 6, 16, 8),
                  child: Semantics(
                    liveRegion: true,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.wifi_off_rounded, size: 16, color: Colors.white),
                        const SizedBox(width: 8),
                        Text(
                          offline ? "You're offline — showing saved data" : '',
                          style: context.text.labelMedium?.copyWith(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
