import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import 'order_providers.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 400) ref.read(ordersProvider.notifier).loadMore();
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orders = ref.watch(ordersProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('My orders'),
        leading: context.canPop() ? null : BackButton(onPressed: () => context.go('/account')),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(ordersProvider.future),
        child: orders.when(
          loading: () => Shimmer(
            child: ListView.separated(
              padding: const EdgeInsets.all(8),
              physics: const NeverScrollableScrollPhysics(),
              itemCount: 5,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, _) => const Skeleton(height: 132, radius: 2),
            ),
          ),
          error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(ordersProvider)),
          data: (page) {
            if (page.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'No orders yet',
                    message: 'When you place an order, it will show up here.',
                    actionLabel: 'Start shopping',
                    onAction: () => context.go('/'),
                  ),
                ],
              );
            }
            return ListView.separated(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(0, 8, 0, 16),
              itemCount: page.items.length + 1,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                if (i == page.items.length) {
                  return LoadMoreFooter(
                    loading: page.loadingMore,
                    error: page.loadMoreError,
                    onRetry: () => ref.read(ordersProvider.notifier).loadMore(),
                  );
                }
                return OrderCard(order: page.items[i]);
              },
            );
          },
        ),
      ),
    );
  }
}

class OrderCard extends StatelessWidget {
  const OrderCard({super.key, required this.order});
  final Order order;

  @override
  Widget build(BuildContext context) {
    final images = order.items.map((i) => i.product?.image ?? '').where((s) => s.isNotEmpty).take(3).toList();
    return Card(
      shape: const RoundedRectangleBorder(),
      color: Colors.white,
      child: InkWell(
        onTap: () => context.push('/orders/${order.id}', extra: order),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text(order.orderId, style: context.text.titleSmall)),
                  StatusChip(status: order.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Placed ${formatDate(order.createdAt)} · ${order.itemCount} item${order.itemCount == 1 ? '' : 's'}',
                style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  for (final img in images)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: AppImage(
                        img,
                        width: 52,
                        height: 52,
                        fit: BoxFit.contain,
                        cacheWidth: 52,
                        backgroundColor: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  if (order.items.length > 3)
                    Text('+${order.items.length - 3}', style: context.text.labelLarge),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(formatPrice(order.finalAmount), style: context.text.titleMedium),
                      Text(order.paymentLabel, style: context.text.labelSmall?.copyWith(color: context.palette.mutedText)),
                    ],
                  ),
                ],
              ),
              if (order.expectedDeliveryDate != null &&
                  (order.status == OrderStatus.processing ||
                      order.status == OrderStatus.pending ||
                      order.status == OrderStatus.shipped)) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(Icons.local_shipping_outlined, size: 16, color: context.colors.primary),
                    const SizedBox(width: 6),
                    Text(
                      'Arriving by ${formatShortDate(order.expectedDeliveryDate)}',
                      style: context.text.labelMedium?.copyWith(color: context.colors.primary),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});
  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      OrderStatus.delivered || OrderStatus.refunded => context.palette.success,
      OrderStatus.cancelled || OrderStatus.returnRejected => context.colors.error,
      OrderStatus.shipped => context.colors.primary,
      OrderStatus.returnRequested || OrderStatus.returned => AppColors.warning,
      _ => context.colors.tertiary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        status.label,
        style: context.text.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
