import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/address.dart';
import '../../data/models/order.dart';
import '../../data/models/store_settings.dart';
import '../../data/models/user.dart';
import '../../data/repositories/order_repository.dart';
import '../../shared/widgets/app_image.dart';
import '../../shared/widgets/feedback.dart';
import '../../shared/widgets/state_views.dart';
import '../account/account_providers.dart';
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';
import '../cart/cart_screen.dart';
import '../catalog/catalog_providers.dart';
import '../orders/order_providers.dart';
import 'domain/checkout_pricing.dart';
import 'razorpay_service.dart';

enum PaymentChoice { online, cod }

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  int? _addressId;
  Coupon? _coupon;
  bool _redeemPoints = false;
  bool _redeemWallet = false;
  PaymentChoice _payment = PaymentChoice.online;
  bool _placing = false;
  final _couponField = TextEditingController();
  String? _couponError;

  @override
  void dispose() {
    _couponField.dispose();
    super.dispose();
  }

  Address? _resolveAddress(List<Address> list) {
    if (list.isEmpty) return null;
    for (final a in list) {
      if (a.id == _addressId) return a;
    }
    return list.firstWhere((a) => a.isDefault, orElse: () => list.first);
  }

  void _applyCoupon(StoreSettings settings, [String? code]) {
    final value = (code ?? _couponField.text).trim();
    if (value.isEmpty) {
      setState(() => _couponError = 'Enter a coupon code');
      return;
    }
    final match = settings.findCoupon(value);
    HapticFeedback.selectionClick();
    setState(() {
      _coupon = match;
      _couponError = match == null ? 'This coupon is not valid' : null;
      if (match != null) _couponField.text = match.code;
    });
    FocusScope.of(context).unfocus();
  }

  Future<void> _pickAddress() async {
    final picked = await context.push<Address>('/addresses?select=1');
    if (picked != null && mounted) setState(() => _addressId = picked.id);
  }

  Future<void> _addAddress() async {
    final saved = await context.push<Address>('/addresses/edit');
    if (saved != null && mounted) setState(() => _addressId = saved.id);
  }

  Future<void> _placeOrder({
    required Address address,
    required CheckoutSummary summary,
    required AppUser user,
  }) async {
    if (_placing) return;
    final selected = ref.read(selectedCartItemsProvider);
    final request = OrderRequest(
      addressId: address.id!,
      selectedCartItemIds: selected.map((i) => i.id).toList(),
      couponCode: _coupon?.code,
      redeemPoints: _redeemPoints,
      redeemWallet: _redeemWallet,
    );
    final repo = ref.read(orderRepositoryProvider);
    setState(() => _placing = true);

    try {
      PlacedOrder placed;
      if (_payment == PaymentChoice.cod || summary.payable <= 0) {
        placed = await repo.placeCashOnDelivery(request);
      } else {
        final rzp = await repo.createRazorpayOrder(summary.payable);
        if (rzp.isMock) {
          // The backend returns a simulated order when Razorpay isn't configured
          // or its API call failed. Only debug builds may complete one.
          if (!kDebugMode) {
            throw ApiException('Online payment is temporarily unavailable. Please choose Cash on Delivery.');
          }
          placed = await repo.verifyRazorpayPayment(
            request: request,
            razorpayOrderId: rzp.orderId,
            razorpayPaymentId: 'pay_mock_${DateTime.now().millisecondsSinceEpoch}',
            razorpaySignature: 'mock_signature',
          );
        } else {
          final outcome = await RazorpayService().checkout(
            order: rzp,
            email: user.email,
            contact: address.phone.isNotEmpty ? address.phone : user.phone,
            name: address.name,
          );
          switch (outcome) {
            case RazorpayCancelled():
              if (mounted) showAppSnack(context, 'Payment cancelled. Your bag is saved.');
              return;
            case RazorpayFailed(:final message):
              if (mounted) showAppSnack(context, message, error: true);
              return;
            case RazorpaySuccess():
              try {
                placed = await repo.verifyRazorpayPayment(
                  request: request,
                  razorpayOrderId: outcome.orderId,
                  razorpayPaymentId: outcome.paymentId,
                  razorpaySignature: outcome.signature,
                );
              } catch (e) {
                if (mounted) await _showPaymentCapturedError(outcome.paymentId, e);
                return;
              }
          }
        }
      }
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      _afterOrderPlaced();
      context.go('/order-success', extra: placed);
    } catch (e) {
      if (mounted) showErrorSnack(context, e);
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  void _afterOrderPlaced() {
    ref.read(cartDeselectionProvider.notifier).clear();
    ref.invalidate(cartControllerProvider);
    ref.invalidate(ordersProvider);
    ref.invalidate(walletProvider);
    ref.read(authControllerProvider.notifier).refreshProfile();
  }

  /// Money was captured but the order wasn't confirmed; the customer needs the
  /// payment id to get it resolved, so this must not be a transient toast.
  Future<void> _showPaymentCapturedError(String paymentId, Object error) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded, size: 36),
        title: const Text('Payment received, order pending'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Your payment went through but we couldn't confirm the order: ${describeError(error)}\n\n"
              'Please contact Collabo support with this payment ID so we can place your order or refund you.',
            ),
            const SizedBox(height: 12),
            SelectableText(paymentId, style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: paymentId));
              showAppSnack(context, 'Payment ID copied');
            },
            child: const Text('Copy ID'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ref.invalidate(cartControllerProvider);
              ref.invalidate(ordersProvider);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final items = ref.watch(selectedCartItemsProvider);
    final cartState = ref.watch(cartControllerProvider);
    final settingsState = ref.watch(storeSettingsProvider);
    final addressesState = ref.watch(addressesProvider);
    final wallet = ref.watch(walletProvider).value;

    if (user == null) return const Scaffold(body: LoadingView());

    final loadError = cartState.error ?? settingsState.error ?? addressesState.error;
    final loading = cartState.isLoading || settingsState.isLoading || addressesState.isLoading;
    if (loadError != null && !loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: ErrorView(
          error: loadError,
          onRetry: () {
            ref.invalidate(cartControllerProvider);
            ref.invalidate(storeSettingsProvider);
            ref.invalidate(addressesProvider);
          },
        ),
      );
    }
    if (!cartState.hasValue || !settingsState.hasValue || !addressesState.hasValue) {
      return Scaffold(appBar: AppBar(title: const Text('Checkout')), body: const LoadingView());
    }
    if (items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: EmptyState(
          icon: Icons.shopping_bag_outlined,
          title: 'Nothing to check out',
          message: 'Select items in your bag to continue.',
          actionLabel: 'Go to bag',
          onAction: () => context.canPop() ? context.pop() : context.go('/cart'),
        ),
      );
    }

    final settings = settingsState.value!;
    final pendingCode = ref.read(pendingCouponProvider);
    if (pendingCode != null) {
      final match = settings.findCoupon(pendingCode);
      if (match != null && _coupon == null) {
        _coupon = match;
        _couponField.text = match.code;
      }
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) ref.read(pendingCouponProvider.notifier).set(null);
      });
    }
    final address = _resolveAddress(addressesState.value!);
    final walletBalance = wallet?.balance ?? 0;
    final summary = CheckoutPricing.compute(
      items: items,
      settings: settings,
      coupon: _coupon,
      rewardPoints: user.rewardPoints,
      redeemPoints: _redeemPoints,
      walletBalance: walletBalance,
      redeemWallet: _redeemWallet,
    );
    final nothingToPay = summary.payable <= 0;
    final blocked = items.any((i) => !i.product.inStock || i.quantity > i.product.stock);

    return PopScope(
      canPop: !_placing,
      child: Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: AbsorbPointer(
          absorbing: _placing,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 720),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                children: [
                  _Section(
                    step: 1,
                    title: 'Delivery address',
                    trailing: address == null
                        ? null
                        : TextButton(onPressed: _pickAddress, child: const Text('Change')),
                    child: address == null
                        ? OutlinedButton.icon(
                            onPressed: _addAddress,
                            icon: const Icon(Icons.add_location_alt_outlined),
                            label: const Text('Add a delivery address'),
                          )
                        : _AddressSummary(address: address),
                  ),
                  _Section(
                    step: 2,
                    title: 'Order items (${summary.itemCount})',
                    child: Column(
                      children: [
                        for (final item in items)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              children: [
                                AppImage(
                                  item.product.image,
                                  width: 56,
                                  height: 56,
                                  fit: BoxFit.contain,
                                  cacheWidth: 56,
                                  backgroundColor: Colors.white,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.product.name, maxLines: 2, overflow: TextOverflow.ellipsis),
                                      Text(
                                        'Qty ${item.quantity}',
                                        style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(formatPrice(item.lineTotal), style: context.text.titleSmall),
                              ],
                            ),
                          ),
                        if (blocked)
                          Text(
                            'Some items are out of stock. Update your bag to continue.',
                            style: TextStyle(color: context.colors.error),
                          ),
                      ],
                    ),
                  ),
                  _Section(
                    step: 3,
                    title: 'Offers & rewards',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_coupon != null)
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.verified_rounded, color: context.palette.success),
                            title: Text('${_coupon!.code} applied'),
                            subtitle: Text('You save ${formatPrice(summary.couponDiscount)}'),
                            trailing: TextButton(
                              onPressed: () => setState(() {
                                _coupon = null;
                                _couponField.clear();
                              }),
                              child: const Text('Remove'),
                            ),
                          )
                        else ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _couponField,
                                  textCapitalization: TextCapitalization.characters,
                                  textInputAction: TextInputAction.done,
                                  onSubmitted: (_) => _applyCoupon(settings),
                                  decoration: InputDecoration(
                                    hintText: 'Coupon code',
                                    prefixIcon: const Icon(Icons.local_offer_outlined),
                                    errorText: _couponError,
                                    isDense: true,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(minimumSize: const Size(80, 50)),
                                onPressed: () => _applyCoupon(settings),
                                child: const Text('Apply'),
                              ),
                            ],
                          ),
                          if (settings.coupons.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                for (final c in settings.coupons)
                                  ActionChip(
                                    avatar: const Icon(Icons.sell_outlined, size: 16),
                                    label: Text('${c.code} · ${c.discountPercent.round()}% off'),
                                    onPressed: () => _applyCoupon(settings, c.code),
                                  ),
                              ],
                            ),
                          ],
                        ],
                        const Divider(height: 24),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          secondary: const Icon(Icons.stars_rounded, color: Color(0xFFF5A623)),
                          title: Text('Use reward points (${user.rewardPoints})'),
                          subtitle: Text(
                            user.canRedeemPoints
                                ? (_redeemPoints ? 'Saving ${formatPrice(summary.pointsRedeemed)}' : '1 point = ₹1')
                                : 'Collect 100 points to start redeeming',
                          ),
                          value: _redeemPoints && user.canRedeemPoints,
                          onChanged: user.canRedeemPoints ? (v) => setState(() => _redeemPoints = v) : null,
                        ),
                        if (walletBalance > 0)
                          SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            secondary: Icon(Icons.account_balance_wallet_rounded, color: context.colors.primary),
                            title: Text('Use wallet (${formatPrice(walletBalance)})'),
                            subtitle: Text(
                              _redeemWallet ? 'Saving ${formatPrice(summary.walletRedeemed)}' : 'Referral earnings',
                            ),
                            value: _redeemWallet,
                            onChanged: (v) => setState(() => _redeemWallet = v),
                          ),
                      ],
                    ),
                  ),
                  _Section(
                    step: 4,
                    title: 'Payment method',
                    child: nothingToPay
                        ? ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.check_circle_rounded, color: context.palette.success),
                            title: const Text('No payment needed'),
                            subtitle: const Text('Your rewards cover this order.'),
                          )
                        : RadioGroup<PaymentChoice>(
                            groupValue: _payment,
                            onChanged: (v) => setState(() => _payment = v ?? _payment),
                            child: const Column(
                              children: [
                                _PaymentOption(
                                  value: PaymentChoice.online,
                                  icon: Icons.bolt_rounded,
                                  title: 'Pay online',
                                  subtitle: 'UPI, cards, netbanking & wallets via Razorpay',
                                ),
                                _PaymentOption(
                                  value: PaymentChoice.cod,
                                  icon: Icons.payments_outlined,
                                  title: 'Cash on Delivery',
                                  subtitle: 'Pay when your order arrives',
                                ),
                              ],
                            ),
                          ),
                  ),
                  const SizedBox(height: 4),
                  PriceSummaryCard(summary: summary),
                  if (summary.pointsEarned > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Row(
                        children: [
                          const Icon(Icons.stars_rounded, size: 18, color: Color(0xFFF5A623)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              "You'll earn ${summary.pointsEarned} reward point${summary.pointsEarned == 1 ? '' : 's'} on this order",
                              style: context.text.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.verified_user_outlined, size: 18, color: context.palette.mutedText),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Payments are processed securely by Razorpay. Collabo never stores your card details.',
                          style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        bottomNavigationBar: Material(
          color: context.colors.surface,
          elevation: 8,
          shadowColor: Colors.black26,
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          formatPrice(summary.payable),
                          style: context.text.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        Text('Total payable', style: context.text.labelSmall?.copyWith(color: context.palette.mutedText)),
                      ],
                    ),
                  ),
                  FilledButton(
                    onPressed: (address == null || blocked || _placing)
                        ? null
                        : () => _placeOrder(address: address, summary: summary, user: user),
                    child: _placing
                        ? SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.4, color: context.colors.onPrimary),
                          )
                        : Text(
                            nothingToPay || _payment == PaymentChoice.cod
                                ? 'Place order'
                                : 'Pay ${formatPrice(summary.payable)}',
                          ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.step, required this.title, required this.child, this.trailing});

  final int step;
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 12, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: context.colors.primary,
                    child: Text(
                      '$step',
                      style: context.text.labelSmall?.copyWith(color: context.colors.onPrimary, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Semantics(header: true, child: Text(title, style: context.text.titleSmall))),
                  ?trailing,
                ],
              ),
              const SizedBox(height: 12),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _AddressSummary extends StatelessWidget {
  const _AddressSummary({required this.address});
  final Address address;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.location_on_rounded, color: context.colors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${address.name} · ${address.phone}', style: context.text.titleSmall),
              const SizedBox(height: 2),
              Text(address.singleLine, style: context.text.bodyMedium?.copyWith(color: context.palette.mutedText)),
            ],
          ),
        ),
      ],
    );
  }
}

class _PaymentOption extends StatelessWidget {
  const _PaymentOption({required this.value, required this.icon, required this.title, required this.subtitle});

  final PaymentChoice value;
  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return RadioListTile<PaymentChoice>(
      value: value,
      contentPadding: EdgeInsets.zero,
      secondary: Icon(icon, color: context.colors.primary),
      title: Text(title, style: context.text.titleSmall),
      subtitle: Text(subtitle),
    );
  }
}
