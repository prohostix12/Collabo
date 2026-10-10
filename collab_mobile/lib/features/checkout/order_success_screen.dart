import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../shared/widgets/feedback.dart';

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key, required this.result});
  final PlacedOrder? result;

  @override
  Widget build(BuildContext context) {
    final orderId = result?.orderId ?? '';
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) context.go('/');
      },
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: 1),
                      duration: const Duration(milliseconds: 700),
                      curve: Curves.elasticOut,
                      builder: (_, v, child) => Transform.scale(scale: v, child: child),
                      child: Container(
                        width: 112,
                        height: 112,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: context.palette.success.withValues(alpha: 0.14),
                        ),
                        child: Icon(Icons.check_circle_rounded, size: 76, color: context.palette.success),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Semantics(
                      header: true,
                      liveRegion: true,
                      child: Text('Order placed!', style: context.text.headlineMedium, textAlign: TextAlign.center),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Thank you for shopping with Collabo. We will send updates on WhatsApp and email.',
                      textAlign: TextAlign.center,
                      style: context.text.bodyLarge?.copyWith(color: context.palette.mutedText),
                    ),
                    const SizedBox(height: 24),
                    if (orderId.isNotEmpty)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              _Row(
                                label: 'Order ID',
                                value: orderId,
                                onCopy: () {
                                  Clipboard.setData(ClipboardData(text: orderId));
                                  showAppSnack(context, 'Order ID copied');
                                },
                              ),
                              if (result?.paymentId?.isNotEmpty ?? false) _Row(label: 'Payment ID', value: result!.paymentId!),
                              if (result?.expectedDelivery != null)
                                _Row(label: 'Expected by', value: formatShortDate(result!.expectedDelivery)),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(onPressed: () => context.go('/orders'), child: const Text('View my orders')),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(onPressed: () => context.go('/'), child: const Text('Continue shopping')),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.onCopy});
  final String label;
  final String value;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(label, style: context.text.bodyMedium?.copyWith(color: context.palette.mutedText)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value, textAlign: TextAlign.end, style: context.text.titleSmall),
          ),
          if (onCopy != null)
            IconButton(tooltip: 'Copy', onPressed: onCopy, icon: const Icon(Icons.copy_rounded, size: 18)),
        ],
      ),
    );
  }
}
