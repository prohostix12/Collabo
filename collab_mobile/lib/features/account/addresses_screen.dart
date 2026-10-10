import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/address.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import 'account_providers.dart';

/// Saved addresses. In [selectMode] (from checkout) tapping an address pops
/// it back to the caller.
class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key, this.selectMode = false});
  final bool selectMode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressesProvider);

    Future<void> add() async {
      final saved = await context.push<Address>('/addresses/edit');
      if (saved != null && selectMode && context.mounted) context.pop(saved);
    }

    return Scaffold(
      appBar: AppBar(title: Text(selectMode ? 'Choose delivery address' : 'Saved addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: add,
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text('Add address'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(addressesProvider.future),
        child: addresses.when(
          loading: () => Shimmer(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (_, _) => const Skeleton(height: 110, radius: 16),
            ),
          ),
          error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(addressesProvider)),
          data: (list) {
            if (list.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.location_off_outlined,
                    title: 'No saved addresses',
                    message: 'Add an address to get your orders delivered.',
                    actionLabel: 'Add address',
                    onAction: add,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              itemCount: list.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _AddressCard(
                address: list[i],
                onTap: selectMode ? () => context.pop(list[i]) : null,
              ),
            );
          },
        ),
      ),
    );
  }
}

class _AddressCard extends ConsumerWidget {
  const _AddressCard({required this.address, this.onTap});
  final Address address;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> delete() async {
      final ok = await confirmDialog(
        context,
        title: 'Delete address?',
        message: address.singleLine,
        confirmLabel: 'Delete',
        destructive: true,
      );
      if (!ok) return;
      try {
        await ref.read(addressesProvider.notifier).delete(address.id!);
        if (context.mounted) showAppSnack(context, 'Address deleted');
      } catch (e) {
        if (context.mounted) showErrorSnack(context, e);
      }
    }

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.radius),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 4, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Icon(Icons.location_on_outlined, color: context.colors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(child: Text(address.name, style: context.text.titleSmall)),
                        if (address.isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: context.colors.primaryContainer,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text('Default', style: context.text.labelSmall),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(address.singleLine, style: context.text.bodyMedium?.copyWith(color: context.palette.mutedText)),
                    const SizedBox(height: 4),
                    Text('Phone: ${address.phone}', style: context.text.bodySmall),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                tooltip: 'Address options',
                onSelected: (v) {
                  if (v == 'edit') context.push<Address>('/addresses/edit', extra: address);
                  if (v == 'delete') delete();
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
