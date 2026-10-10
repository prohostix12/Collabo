import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config/env.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/user.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/feedback.dart';
import '../auth/auth_controller.dart';
import '../notifications/notifications_provider.dart';
import 'account_providers.dart';
import 'profile_screens.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletProvider);
          await ref.read(authControllerProvider.notifier).refreshProfile();
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            if (user == null) const _GuestHeader() else _UserHeader(user: user),
            const SizedBox(height: 8),
            if (user != null) ...[
              _QuickTiles(unread: ref.watch(unreadNotificationsProvider)),
              const SizedBox(height: 8),
              _Group(children: [
                _Item(icon: Icons.receipt_long_outlined, title: 'My orders', onTap: () => context.push('/orders')),
                _Item(
                  icon: Icons.notifications_none_rounded,
                  title: 'Notifications',
                  badge: ref.watch(unreadNotificationsProvider),
                  onTap: () => context.push('/notifications'),
                ),
                _Item(icon: Icons.location_on_outlined, title: 'Saved addresses', onTap: () => context.push('/addresses')),
                _Item(
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'Wallet & rewards',
                  onTap: () => context.push('/wallet'),
                ),
                _Item(icon: Icons.favorite_border_rounded, title: 'Wishlist', onTap: () => context.push('/wishlist')),
              ]),
              const SizedBox(height: 8),
              if (user.affiliateCode.isNotEmpty) ...[
                _InviteCard(code: user.affiliateCode),
                const SizedBox(height: 8),
              ],
              _Group(children: [
                _Item(icon: Icons.person_outline_rounded, title: 'Edit profile', onTap: () => context.push('/profile/edit')),
                _Item(icon: Icons.lock_outline_rounded, title: 'Change password', onTap: () => context.push('/profile/password')),
              ]),
              const SizedBox(height: 8),
            ],
            _Group(children: [
              _Item(
                icon: Icons.storefront_rounded,
                title: 'Sell on Collabo',
                onTap: () => launchUrl(Uri.parse('${Env.websiteUrl}/sell'), mode: LaunchMode.externalApplication),
              ),
              _Item(
                icon: Icons.support_agent_rounded,
                title: 'Help & support',
                subtitle: Env.supportEmail,
                onTap: () {
                  Clipboard.setData(const ClipboardData(text: Env.supportEmail));
                  showAppSnack(context, 'Support email copied');
                },
              ),
              _Item(
                icon: Icons.info_outline_rounded,
                title: 'About Collabo',
                onTap: () => showAboutDialog(
                  context: context,
                  applicationName: 'Collabo',
                  applicationVersion: '1.0.0',
                  applicationIcon: const BrandLogo(height: 22),
                  children: const [Text('Shop creator-recommended products with exclusive deals and rewards.')],
                ),
              ),
            ]),
            if (user != null) ...[
              const SizedBox(height: 8),
              _Group(children: [
                _Item(
                  icon: Icons.logout_rounded,
                  title: 'Sign out',
                  onTap: () async {
                    final ok = await confirmDialog(
                      context,
                      title: 'Sign out?',
                      message: 'You can sign back in any time.',
                      confirmLabel: 'Sign out',
                    );
                    if (!ok) return;
                    await ref.read(authControllerProvider.notifier).logout();
                    if (context.mounted) showAppSnack(context, 'Signed out');
                  },
                ),
                _Item(
                  icon: Icons.delete_forever_outlined,
                  title: 'Delete account',
                  destructive: true,
                  onTap: () => showDeleteAccountDialog(context, ref),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }
}

/// Flipkart's 2x2 shortcut grid under the profile header.
class _QuickTiles extends StatelessWidget {
  const _QuickTiles({required this.unread});
  final int unread;

  @override
  Widget build(BuildContext context) {
    Widget tile(IconData icon, String label, VoidCallback onTap, {int badge = 0}) => Expanded(
          child: InkWell(
            onTap: onTap,
            child: Container(
              height: 52,
              margin: const EdgeInsets.all(4),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFE0E0E0)),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: [
                  Badge(
                    isLabelVisible: badge > 0,
                    label: Text('$badge'),
                    backgroundColor: AppColors.cta,
                    child: Icon(icon, color: const Color(0xFF006D8F), size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(label, style: context.text.titleSmall, overflow: TextOverflow.ellipsis)),
                ],
              ),
            ),
          ),
        );
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(8),
      child: Column(
        children: [
          Row(children: [
            tile(Icons.inventory_2_outlined, 'Orders', () => context.push('/orders')),
            tile(Icons.favorite_border_rounded, 'Wishlist', () => context.push('/wishlist')),
          ]),
          Row(children: [
            tile(Icons.account_balance_wallet_outlined, 'Wallet', () => context.push('/wallet')),
            tile(Icons.notifications_none_rounded, 'Alerts', () => context.push('/notifications'), badge: unread),
          ]),
        ],
      ),
    );
  }
}

class _GuestHeader extends StatelessWidget {
  const _GuestHeader();

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: const RoundedRectangleBorder(),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome to Collabo', style: context.text.titleLarge),
            const SizedBox(height: 6),
            Text(
              'Sign in to track orders, save addresses and earn reward points on every purchase.',
              style: context.text.bodyMedium?.copyWith(color: context.palette.mutedText),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: FilledButton(onPressed: () => context.push('/login'), child: const Text('Sign in'))),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(onPressed: () => context.push('/register'), child: const Text('Create account')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _UserHeader extends ConsumerWidget {
  const _UserHeader({required this.user});
  final AppUser user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wallet = ref.watch(walletProvider).value;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF004D66), Color(0xFF006D8F)], // Peacock Blue gradient
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white,
                child: Text(
                  user.initials,
                  style: context.text.titleLarge?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.displayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.titleLarge?.copyWith(color: Colors.white),
                    ),
                    Text(
                      user.email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.85)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _Stat(label: 'Reward points', value: '${user.rewardPoints}', onTap: () => context.push('/wallet')),
              const SizedBox(width: 12),
              _Stat(
                label: 'Wallet',
                value: wallet == null ? '—' : formatPrice(wallet.balance),
                onTap: () => context.push('/wallet'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.onTap});
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(4),
        child: InkWell(
          borderRadius: BorderRadius.circular(4),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: context.text.titleLarge?.copyWith(color: Colors.white)),
                Text(label, style: context.text.labelSmall?.copyWith(color: Colors.white.withValues(alpha: 0.85))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InviteCard extends StatelessWidget {
  const _InviteCard({required this.code});
  final String code;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: const RoundedRectangleBorder(),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.cta.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.card_giftcard_rounded, color: AppColors.cta),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Invite friends, earn rewards', style: context.text.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    'Share code $code — earn on every order they place.',
                    style: context.text.bodySmall?.copyWith(color: context.palette.mutedText),
                  ),
                ],
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: 'Share invite link',
                  icon: const Icon(Icons.share_rounded),
                  onPressed: () {
                    Share.share('Join Collabo and start saving! Use my invite code: $code. https://collabo.co.in/?ref=$code');
                  },
                ),
                IconButton(
                  tooltip: 'Copy invite code',
                  icon: const Icon(Icons.copy_rounded),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: code));
                    showAppSnack(context, 'Invite code copied');
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


class _Group extends StatelessWidget {
  const _Group({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: const RoundedRectangleBorder(),
      color: Colors.white,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1) const Divider(indent: 56),
          ],
        ],
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.badge = 0,
    this.destructive = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final int badge;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? context.colors.error : null;
    return ListTile(
      leading: Icon(icon, color: color ?? const Color(0xFF006D8F)),
      title: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
      subtitle: subtitle == null ? null : Text(subtitle!),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge > 0) Badge(label: Text('$badge'), backgroundColor: AppColors.cta),
          const SizedBox(width: 6),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
      onTap: onTap,
    );
  }
}
