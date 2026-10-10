import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/env.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/state_views.dart';
import '../catalog/catalog_providers.dart';
import '../product/product_detail_screen.dart';
import 'order_providers.dart';
import 'orders_screen.dart';

/// Mirrors CANCEL_REASONS in the web storefront.
const _cancelReasons = [
  'Changed my mind',
  'Ordered by mistake / Duplicate order',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Wrong item selected',
  'Wrong delivery address entered',
  'Item no longer needed',
  'Payment issue / Want to repay',
  'Other',
];

const _returnReasons = [
  'Received a damaged item',
  'Item is defective / not working',
  'Received the wrong item',
  'Item does not match the description',
  'Size or fit issue',
  'Missing parts or accessories',
  'Other',
];

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId, this.initial});

  final int orderId;
  final Order? initial;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(orderDetailProvider(orderId));
    final order = async.value ?? initial;

    return Scaffold(
      appBar: AppBar(
        title: Text(order?.orderId ?? 'Order details'),
        bottom: async.isLoading && order != null
            ? const PreferredSize(preferredSize: Size.fromHeight(2), child: LinearProgressIndicator(minHeight: 2))
            : null,
      ),
      body: order == null
          ? (async.hasError
              ? ErrorView(error: async.error, onRetry: () => ref.invalidate(orderDetailProvider(orderId)))
              : const LoadingView())
          : RefreshIndicator(
              onRefresh: () {
                ref.invalidate(orderTrackingProvider(orderId));
                return ref.refresh(orderDetailProvider(orderId).future);
              },
              child: _OrderBody(order: order),
            ),
    );
  }
}

class _OrderBody extends ConsumerWidget {
  const _OrderBody({required this.order});
  final Order order;

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final result = await showModalBottomSheet<_ReasonResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const _ReasonSheet(
        title: 'Cancel order',
        reasons: _cancelReasons,
        commentLabel: 'Tell us a little more',
        commentRequired: true,
        confirmLabel: 'Cancel order',
        destructive: true,
      ),
    );
    if (result == null || !context.mounted) return;
    await _run(context, ref, () => ref.read(orderRepositoryProvider).cancel(
          order.id,
          reason: result.reason,
          comment: result.comment,
        ), 'Order cancelled');
  }

  Future<void> _return(BuildContext context, WidgetRef ref) async {
    final result = await showModalBottomSheet<_ReasonResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const _ReasonSheet(
        title: 'Return items',
        reasons: _returnReasons,
        commentLabel: 'Describe the issue (optional)',
        commentRequired: false,
        confirmLabel: 'Request return',
      ),
    );
    if (result == null || !context.mounted) return;
    await _run(context, ref, () => ref.read(orderRepositoryProvider).requestReturn(
          order.id,
          reason: result.reason,
          comment: result.comment,
        ), 'Return requested. We will be in touch soon.');
  }

  Future<void> _run(BuildContext context, WidgetRef ref, Future<Order> Function() action, String success) async {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const PopScope(canPop: false, child: Center(child: CircularProgressIndicator())),
    );
    try {
      final updated = await action();
      ref.read(ordersProvider.notifier).replace(updated);
      ref.invalidate(orderDetailProvider(order.id));
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        showAppSnack(context, success);
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        showErrorSnack(context, e);
      }
    }
  }

  Future<void> _rate(BuildContext context, WidgetRef ref, OrderItem item) async {
    final product = item.product;
    if (product == null) return;
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => WriteReviewSheet(product: product),
    );
    if (ok == true) {
      ref.invalidate(productReviewsProvider(product.id));
      if (context.mounted) showAppSnack(context, 'Thanks for your review!');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final muted = context.palette.mutedText;
    final o = order;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Placed on ${formatDateTime(o.createdAt)}', style: context.text.bodySmall?.copyWith(color: muted)),
                          if (o.expectedDeliveryDate != null && !o.status.isTerminalNegative && o.status != OrderStatus.delivered)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Arriving by ${formatShortDate(o.expectedDeliveryDate)}',
                                style: context.text.titleSmall?.copyWith(color: context.colors.primary),
                              ),
                            ),
                        ],
                      ),
                    ),
                    StatusChip(status: o.status),
                  ],
                ),
                const SizedBox(height: 16),
                _Timeline(order: o),
              ],
            ),
          ),
        ),
        if (o.hasTracking) ...[
          const SizedBox(height: 12),
          _TrackingCard(order: o),
        ],
        if (o.status == OrderStatus.cancelled && o.cancelReason.isNotEmpty) ...[
          const SizedBox(height: 12),
          _NoteCard(
            icon: Icons.cancel_outlined,
            title: 'Cancelled ${formatDate(o.cancelledAt)}',
            lines: [o.cancelReason, if (o.cancelComment.isNotEmpty) o.cancelComment],
            color: context.colors.error,
          ),
        ],
        if (o.returnReason.isNotEmpty) ...[
          const SizedBox(height: 12),
          _NoteCard(
            icon: Icons.assignment_return_outlined,
            title: 'Return ${o.status.label.toLowerCase()}',
            lines: [o.returnReason, if (o.returnComment.isNotEmpty) o.returnComment],
            color: AppColors.warning,
          ),
        ],
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Items', style: context.text.titleMedium),
                const SizedBox(height: 8),
                for (final item in o.items)
                  InkWell(
                    onTap: item.product == null ? null : () => context.push('/product/${item.productId}'),
                    borderRadius: BorderRadius.circular(4),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          AppImage(
                            item.product?.image ?? '',
                            width: 64,
                            height: 64,
                            fit: BoxFit.contain,
                            cacheWidth: 64,
                            backgroundColor: Colors.white,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.name, maxLines: 2, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text(
                                  '${formatPrice(item.price)} × ${item.quantity}',
                                  style: context.text.bodySmall?.copyWith(color: muted),
                                ),
                                if (o.status == OrderStatus.delivered && item.product != null)
                                  TextButton.icon(
                                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
                                    onPressed: () => _rate(context, ref, item),
                                    icon: const Icon(Icons.star_outline_rounded, size: 18),
                                    label: const Text('Rate product'),
                                  ),
                              ],
                            ),
                          ),
                          Text(formatPrice(item.lineTotal), style: context.text.titleSmall),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (o.address != null) ...[
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Delivery address', style: context.text.titleMedium),
                  const SizedBox(height: 8),
                  Text('${o.address!.name} · ${o.address!.phone}', style: context.text.titleSmall),
                  const SizedBox(height: 2),
                  Text(o.address!.singleLine, style: context.text.bodyMedium?.copyWith(color: muted)),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Payment', style: context.text.titleMedium),
                const SizedBox(height: 8),
                _Line('Items total', formatPrice(o.totalAmount)),
                if (o.discountAmount > 0)
                  _Line('Discounts & rewards', '− ${formatPrice(o.discountAmount)}', color: context.palette.discount),
                _Line('Delivery', o.deliveryCharge == 0 ? 'FREE' : formatPrice(o.deliveryCharge)),
                const Divider(height: 20),
                _Line('Order total', formatPrice(o.finalAmount), bold: true),
                const SizedBox(height: 6),
                _Line('Method', o.paymentLabel),
                _Line('Status', capitalize(o.paymentStatus)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (o.canCancel)
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: context.colors.error),
            onPressed: () => _cancel(context, ref),
            icon: const Icon(Icons.cancel_outlined),
            label: const Text('Cancel order'),
          ),
        if (o.canReturn)
          OutlinedButton.icon(
            onPressed: () => _return(context, ref),
            icon: const Icon(Icons.assignment_return_outlined),
            label: const Text('Return items'),
          ),
        const SizedBox(height: 16),
        Center(
          child: TextButton.icon(
            onPressed: () {
              Clipboard.setData(const ClipboardData(text: Env.supportEmail));
              showAppSnack(context, 'Support email copied: ${Env.supportEmail}');
            },
            icon: const Icon(Icons.support_agent_rounded),
            label: const Text('Need help with this order?'),
          ),
        ),
      ],
    );
  }
}

class _Line extends StatelessWidget {
  const _Line(this.label, this.value, {this.color, this.bold = false});
  final String label;
  final String value;
  final Color? color;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final style = bold ? context.text.titleMedium : context.text.bodyMedium;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(child: Text(label, style: style)),
          Text(value, style: style?.copyWith(color: color, fontWeight: bold ? FontWeight.w800 : FontWeight.w600)),
        ],
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  const _NoteCard({required this.icon, required this.title, required this.lines, required this.color});
  final IconData icon;
  final String title;
  final List<String> lines;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: context.text.titleSmall),
                  for (final l in lines)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(l, style: context.text.bodyMedium?.copyWith(color: context.palette.mutedText)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.order});
  final Order order;

  @override
  Widget build(BuildContext context) {
    final o = order;
    final steps = <(String, String?, bool)>[];
    final s = o.status;

    final confirmed = s != OrderStatus.pending && s != OrderStatus.cancelled || o.shippedAt != null;
    final shipped = o.shippedAt != null ||
        const [OrderStatus.shipped, OrderStatus.delivered, OrderStatus.returnRequested, OrderStatus.returned, OrderStatus.refunded, OrderStatus.returnRejected]
            .contains(s);
    final delivered = const [OrderStatus.delivered, OrderStatus.returnRequested, OrderStatus.returned, OrderStatus.refunded, OrderStatus.returnRejected]
        .contains(s);

    steps.add(('Order placed', formatDateTime(o.createdAt), true));
    if (s == OrderStatus.cancelled) {
      steps.add(('Cancelled', formatDateTime(o.cancelledAt), true));
    } else {
      steps.add(('Confirmed', null, confirmed));
      steps.add(('Shipped', o.shippedAt != null ? formatDateTime(o.shippedAt) : null, shipped));
      steps.add(('Delivered', delivered ? null : (o.expectedDeliveryDate != null ? 'Expected ${formatShortDate(o.expectedDeliveryDate)}' : null), delivered));
      if (o.returnRequestedAt != null) {
        steps.add(('Return requested', formatDateTime(o.returnRequestedAt), true));
      }
      if (s == OrderStatus.returned || s == OrderStatus.refunded || s == OrderStatus.returnRejected) {
        steps.add((s.label, null, true));
      }
    }

    return Semantics(
      label: 'Order status: ${s.label}',
      child: Column(
        children: [
          for (var i = 0; i < steps.length; i++)
            _TimelineStep(
              title: steps[i].$1,
              subtitle: steps[i].$2,
              done: steps[i].$3,
              isLast: i == steps.length - 1,
              nextDone: i < steps.length - 1 && steps[i + 1].$3,
              negative: steps[i].$1 == 'Cancelled' || steps[i].$1 == 'Return rejected',
              index: i,
            ),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.title,
    required this.subtitle,
    required this.done,
    required this.isLast,
    required this.nextDone,
    required this.negative,
    required this.index,
  });

  final String title;
  final String? subtitle;
  final bool done;
  final bool isLast;
  final bool nextDone;
  final bool negative;
  final int index;

  @override
  Widget build(BuildContext context) {
    final active = negative ? context.colors.error : context.palette.success;
    final idle = context.colors.outlineVariant;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 300 + index * 120),
      curve: Curves.easeOut,
      builder: (_, v, child) => Opacity(opacity: v, child: child),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 28,
              child: Column(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: done ? active : Colors.transparent,
                      border: Border.all(color: done ? active : idle, width: 2),
                    ),
                    child: done
                        ? Icon(negative ? Icons.close_rounded : Icons.check_rounded, size: 14, color: Colors.white)
                        : null,
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        margin: const EdgeInsets.symmetric(vertical: 2),
                        color: nextDone ? active : idle,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: context.text.titleSmall?.copyWith(
                        color: done ? null : context.palette.mutedText,
                      ),
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty)
                      Text(subtitle!, style: context.text.bodySmall?.copyWith(color: context.palette.mutedText)),
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

class _TrackingCard extends ConsumerWidget {
  const _TrackingCard({required this.order});
  final Order order;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracking = ref.watch(orderTrackingProvider(order.id)).value;
    final events = tracking?.events ?? const <TrackingEvent>[];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.local_shipping_rounded, color: context.colors.primary),
                const SizedBox(width: 10),
                Expanded(child: Text('Shipment', style: context.text.titleMedium)),
                if (tracking?.etd != null)
                  Text('ETA ${formatShortDate(tracking!.etd)}', style: context.text.labelMedium),
              ],
            ),
            const SizedBox(height: 10),
            if (order.shippingProvider.isNotEmpty)
              Text('Courier: ${order.shippingProvider}', style: context.text.bodyMedium),
            Row(
              children: [
                Expanded(
                  child: Text('Tracking no: ${order.trackingNumber}', style: context.text.bodyMedium),
                ),
                IconButton(
                  tooltip: 'Copy tracking number',
                  icon: const Icon(Icons.copy_rounded, size: 18),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: order.trackingNumber));
                    showAppSnack(context, 'Tracking number copied');
                  },
                ),
              ],
            ),
            if (events.isNotEmpty) ...[
              const Divider(height: 20),
              for (final e in events.take(8))
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(color: context.colors.primary, shape: BoxShape.circle),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.title, style: context.text.bodyMedium),
                            Text(
                              [if (e.location.isNotEmpty) e.location, if (e.date != null) formatDateTime(e.date)].join(' · '),
                              style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReasonResult {
  const _ReasonResult(this.reason, this.comment);
  final String reason;
  final String comment;
}

class _ReasonSheet extends StatefulWidget {
  const _ReasonSheet({
    required this.title,
    required this.reasons,
    required this.commentLabel,
    required this.commentRequired,
    required this.confirmLabel,
    this.destructive = false,
  });

  final String title;
  final List<String> reasons;
  final String commentLabel;
  final bool commentRequired;
  final String confirmLabel;
  final bool destructive;

  @override
  State<_ReasonSheet> createState() => _ReasonSheetState();
}

class _ReasonSheetState extends State<_ReasonSheet> {
  String? _reason;
  final _comment = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  void _submit() {
    if (_reason == null) {
      setState(() => _error = 'Please choose a reason');
      return;
    }
    if (widget.commentRequired && _comment.text.trim().isEmpty) {
      setState(() => _error = 'Please add a short comment');
      return;
    }
    Navigator.pop(context, _ReasonResult(_reason!, _comment.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.title, style: context.text.titleLarge),
            const SizedBox(height: 8),
            RadioGroup<String>(
              groupValue: _reason,
              onChanged: (v) => setState(() {
                _reason = v;
                _error = null;
              }),
              child: Column(
                children: [
                  for (final r in widget.reasons)
                    RadioListTile<String>(value: r, title: Text(r), contentPadding: EdgeInsets.zero, dense: true),
                ],
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _comment,
              minLines: 2,
              maxLines: 4,
              maxLength: 500,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(labelText: widget.commentLabel),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_error!, style: TextStyle(color: context.colors.error)),
              ),
            FilledButton(
              style: widget.destructive
                  ? FilledButton.styleFrom(
                      backgroundColor: context.colors.error,
                      foregroundColor: context.colors.onError,
                    )
                  : null,
              onPressed: _submit,
              child: Text(widget.confirmLabel),
            ),
          ],
        ),
      ),
    );
  }
}
