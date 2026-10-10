import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../shared/widgets/brand_logo.dart';
import '../cart/cart_controller.dart';

class _Destination {
  const _Destination(this.label, this.icon, this.selectedIcon);
  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

const _destinations = [
  _Destination('Home', Icons.home_rounded, Icons.home_rounded),
  _Destination('Categories', Icons.grid_view_rounded, Icons.grid_view_rounded),
  _Destination('Account', Icons.person_outline_rounded, Icons.person_rounded),
  _Destination('Cart', Icons.shopping_bag_outlined, Icons.shopping_bag_rounded),
];

/// Bottom navigation on phones, a navigation rail on tablets. Android back
/// from any other tab returns to Home before leaving the app.
class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _select(int index) {
    HapticFeedback.selectionClick();
    navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartCountProvider);
    final wide = MediaQuery.sizeOf(context).width >= 720;

    Widget iconFor(int i, bool selected) {
      final d = _destinations[i];
      final icon = Icon(selected ? d.selectedIcon : d.icon);
      if (i != 3 || cartCount == 0) return icon;
      return Badge.count(
        count: cartCount,
        backgroundColor: AppColors.cta,
        child: icon,
      );
    }

    final body = PopScope(
      canPop: navigationShell.currentIndex == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _select(0);
      },
      child: navigationShell,
    );

    if (wide) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: _select,
              labelType: NavigationRailLabelType.all,
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: const SizedBox(width: 72, child: FittedBox(child: BrandLogo(height: 18))),
              ),
              destinations: [
                for (var i = 0; i < _destinations.length; i++)
                  NavigationRailDestination(
                    icon: iconFor(i, false),
                    selectedIcon: iconFor(i, true),
                    label: Text(_destinations[i].label),
                  ),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: body),
          ],
        ),
      );
    }

    return Scaffold(
      body: body,
      bottomNavigationBar: _CustomEcommerceBottomBar(
        currentIndex: navigationShell.currentIndex,
        onSelect: _select,
        cartCount: cartCount,
      ),
    );
  }
}

class _CustomEcommerceBottomBar extends StatelessWidget {
  const _CustomEcommerceBottomBar({
    required this.currentIndex,
    required this.onSelect,
    required this.cartCount,
  });

  final int currentIndex;
  final ValueChanged<int> onSelect;
  final int cartCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.shade200, width: 0.8),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            children: [
              for (var i = 0; i < _destinations.length; i++)
                Expanded(
                  child: _BottomNavItem(
                    destination: _destinations[i],
                    isSelected: i == currentIndex,
                    cartCount: i == 3 ? cartCount : 0,
                    onTap: () => onSelect(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({
    required this.destination,
    required this.isSelected,
    required this.cartCount,
    required this.onTap,
  });

  final _Destination destination;
  final bool isSelected;
  final int cartCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final activeColor = AppColors.peacock;
    final inactiveColor = const Color(0xFF616161);

    Widget iconWidget = Icon(
      isSelected ? destination.selectedIcon : destination.icon,
      color: isSelected ? activeColor : inactiveColor,
      size: 22,
    );

    if (cartCount > 0) {
      iconWidget = Badge(
        isLabelVisible: true,
        label: Text(
          '$cartCount',
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: AppColors.cta,
        offset: const Offset(6, -6),
        child: iconWidget,
      );
    }

    return InkWell(
      onTap: onTap,
      splashColor: activeColor.withValues(alpha: 0.08),
      highlightColor: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 3),
            decoration: BoxDecoration(
              color: isSelected ? activeColor.withValues(alpha: 0.12) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: AnimatedScale(
              scale: isSelected ? 1.08 : 1.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutBack,
              child: iconWidget,
            ),
          ),
          const SizedBox(height: 2),
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: TextStyle(
              fontSize: 11.0,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? activeColor : inactiveColor,
            ),
            child: Text(destination.label),
          ),
        ],
      ),
    );
  }
}
