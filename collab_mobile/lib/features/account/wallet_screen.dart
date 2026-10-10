import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/wallet.dart';
import '../../shared/widgets/shimmer.dart';
import '../../shared/widgets/state_views.dart';
import '../../core/providers.dart';
import '../auth/auth_controller.dart';
import 'account_providers.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wallet = ref.watch(walletProvider);
    final points = ref.watch(currentUserProvider)?.rewardPoints ?? 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Wallet & rewards')),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(authControllerProvider.notifier).refreshProfile();
          return ref.refresh(walletProvider.future);
        },
        child: wallet.when(
          loading: () => Shimmer(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: const [
                Skeleton(height: 150, radius: 22),
                SizedBox(height: 16),
                Skeleton(height: 90, radius: 16),
                SizedBox(height: 16),
                Skeleton(height: 220, radius: 16),
              ],
            ),
          ),
          error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(walletProvider)),
          data: (w) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              _BalanceCard(wallet: w),
              const SizedBox(height: 16),
              Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  leading: const CircleAvatar(
                    backgroundColor: Color(0x22F5A623),
                    child: Icon(Icons.stars_rounded, color: Color(0xFFF5A623)),
                  ),
                  title: Text('$points reward points', style: context.text.titleMedium),
                  subtitle: Text(
                    points >= 100
                        ? 'Redeem at checkout — 1 point = ₹1'
                        : 'Earn 1 point per ₹100 spent. Redeem once you reach 100.',
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Transactions', style: context.text.titleMedium),
              const SizedBox(height: 8),
              if (w.transactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: EmptyState(
                    compact: true,
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'No wallet activity yet',
                    message: 'Share products with friends — you earn when they buy.',
                  ),
                )
              else
                Card(
                  child: Column(
                    children: [
                      for (var i = 0; i < w.transactions.length; i++) ...[
                        _TxnTile(txn: w.transactions[i]),
                        if (i < w.transactions.length - 1) const Divider(indent: 64),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard({required this.wallet});
  final Wallet wallet;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        gradient: const LinearGradient(
          colors: [AppColors.primaryDark, AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Available balance', style: context.text.labelLarge?.copyWith(color: Colors.white70)),
          const SizedBox(height: 6),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: wallet.balance),
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeOutCubic,
            builder: (_, v, _) => Text(
              formatPrice(v.roundToDouble()),
              style: context.text.headlineMedium?.copyWith(color: Colors.white),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.hourglass_bottom_rounded, size: 16, color: Colors.white70),
              const SizedBox(width: 6),
              Text(
                '${formatPrice(wallet.pending)} pending',
                style: context.text.bodySmall?.copyWith(color: Colors.white70),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  useRootNavigator: true,
                  backgroundColor: Colors.white,
                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                  builder: (_) => _WithdrawBottomSheet(wallet: wallet),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primary,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              icon: const Icon(Icons.account_balance_rounded, size: 18),
              label: const Text('Withdraw to Bank'),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Use your balance at checkout, or withdraw directly to your bank account via our website.',
            style: context.text.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }
}

class _TxnTile extends StatelessWidget {
  const _TxnTile({required this.txn});
  final WalletTransaction txn;

  @override
  Widget build(BuildContext context) {
    final credit = txn.isCredit;
    final color = credit ? context.palette.success : context.colors.error;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.12),
        child: Icon(credit ? Icons.south_west_rounded : Icons.north_east_rounded, color: color, size: 20),
      ),
      title: Text(
        txn.reason.isNotEmpty ? txn.reason : (txn.productName.isNotEmpty ? txn.productName : 'Wallet transaction'),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: context.text.bodyMedium,
      ),
      subtitle: Text(
        [formatDate(txn.createdAt), capitalize(txn.status)].where((s) => s.isNotEmpty).join(' · '),
        style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
      ),
      trailing: Text(
        '${credit ? '+' : '−'}${formatPrice(txn.amount.abs())}',
        style: context.text.titleSmall?.copyWith(color: color),
      ),
    );
  }
}

class _WithdrawBottomSheet extends ConsumerStatefulWidget {
  const _WithdrawBottomSheet({required this.wallet});
  final Wallet wallet;

  @override
  ConsumerState<_WithdrawBottomSheet> createState() => _WithdrawBottomSheetState();
}

class _WithdrawBottomSheetState extends ConsumerState<_WithdrawBottomSheet> {
  final _amount = TextEditingController();
  final _name = TextEditingController();
  final _account = TextEditingController();
  final _ifsc = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Use saved bank details if available from the user profile
    final u = ref.read(currentUserProvider);
    if (u != null) {
      _name.text = u.raw['wallet_bank_account_name'] ?? '';
      _account.text = u.raw['wallet_bank_account_number'] ?? '';
      _ifsc.text = u.raw['wallet_bank_ifsc'] ?? '';
    }
  }

  @override
  void dispose() {
    _amount.dispose();
    _name.dispose();
    _account.dispose();
    _ifsc.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final amt = double.tryParse(_amount.text) ?? 0;
    if (amt <= 0) return setState(() => _error = 'Enter a valid amount');
    if (amt > widget.wallet.balance) return setState(() => _error = 'Amount exceeds available balance');
    if (_name.text.isEmpty || _account.text.isEmpty || _ifsc.text.isEmpty) {
      return setState(() => _error = 'Please fill all bank details');
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final repo = ref.read(walletRepositoryProvider);
      await repo.requestWithdrawal(amt, _name.text, _account.text, _ifsc.text);
      ref.invalidate(walletProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.account_balance_wallet_outlined, color: AppColors.primary),
                  const SizedBox(width: 10),
                  Text('Withdraw as Cash', style: context.text.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ],
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _amount,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Amount (₹)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Account holder name', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _account,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Bank account number', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _ifsc,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'IFSC CODE', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          Text('Saved after your first request — you won\'t need to enter it again.', style: context.text.bodySmall),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: context.text.bodyMedium?.copyWith(color: context.colors.error)),
          ],
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryDark,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Request Withdrawal', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
