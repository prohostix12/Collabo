import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import '../catalog/catalog_providers.dart';
import '../orders/order_providers.dart';
import 'notifications_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  DateTime? _seenAtOpen;

  @override
  void initState() {
    super.initState();
    _seenAtOpen = ref.read(notificationsSeenProvider);
    // Mark as read after the first frame so this visit still highlights new items.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(notificationsSeenProvider.notifier).markAllSeen();
    });
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(notificationsProvider);
    final coupons = ref.watch(storeSettingsProvider).value?.coupons ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(ordersProvider.future),
        child: feed.when(
          loading: () => Shimmer(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: 6,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (_, _) => const Skeleton(height: 76, radius: 16),
            ),
          ),
          error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(ordersProvider)),
          data: (items) {
            if (items.isEmpty && coupons.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  EmptyState(
                    icon: Icons.notifications_none_rounded,
                    title: 'No notifications yet',
                    message: 'Updates about your orders will appear here.',
                  ),
                ],
              );
            }
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              children: [
                if (coupons.isNotEmpty) ...[
                  Text('Offers', style: context.text.titleSmall),
                  const SizedBox(height: 8),
                  for (final c in coupons)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _Tile(
                        icon: Icons.local_offer_rounded,
                        iconColor: AppColors.cta,
                        title: 'Use ${c.code} for ${c.discountPercent.round()}% off',
                        body: c.description,
                        trailing: IconButton(
                          tooltip: 'Copy code',
                          icon: const Icon(Icons.copy_rounded, size: 18),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: c.code));
                            showAppSnack(context, 'Coupon ${c.code} copied');
                          },
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                ],
                if (items.isNotEmpty) ...[
                  Text('Order updates', style: context.text.titleSmall),
                  const SizedBox(height: 8),
                ],
                for (final n in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _Tile(
                      icon: n.icon,
                      iconColor: context.colors.primary,
                      title: n.title,
                      body: n.body,
                      time: formatRelative(n.time),
                      unread: _seenAtOpen != null && n.time.isAfter(_seenAtOpen!),
                      onTap: () => context.push('/orders/${n.orderId}', extra: n.order),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.body,
    this.time,
    this.unread = false,
    this.onTap,
    this.trailing,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String body;
  final String? time;
  final bool unread;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: unread ? context.colors.primaryContainer.withValues(alpha: 0.35) : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.radius),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: iconColor.withValues(alpha: 0.12),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(title, style: context.text.titleSmall)),
                        if (unread)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(color: AppColors.cta, shape: BoxShape.circle),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(body, style: context.text.bodySmall?.copyWith(color: context.palette.mutedText)),
                    if (time != null) ...[
                      const SizedBox(height: 4),
                      Text(time!, style: context.text.labelSmall?.copyWith(color: context.palette.mutedText)),
                    ],
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
        ),
      ),
    );
  }
}
