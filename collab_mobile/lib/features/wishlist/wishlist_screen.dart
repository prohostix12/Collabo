import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/widgets/product_widgets.dart';
import '../../shared/widgets/state_views.dart';
import '../auth/auth_controller.dart';
import 'wishlist_controller.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(isLoggedInProvider);
    final products = ref.watch(wishlistProductsProvider);
    // Hide hearts the user just toggled off without waiting for a refetch.
    final ids = ref.watch(wishlistControllerProvider).value;

    return Scaffold(
      appBar: AppBar(
        title: Text(ids != null && ids.isNotEmpty ? 'My Wishlist (${ids.length})' : 'My Wishlist'),
      ),
      body: !loggedIn
          ? EmptyState(
              icon: Icons.favorite_border_rounded,
              title: 'Save what you love',
              message: 'Sign in to keep a wishlist and get back to it any time.',
              actionLabel: 'Sign in',
              onAction: () => context.push('/login'),
            )
          : RefreshIndicator(
              onRefresh: () {
                ref.invalidate(wishlistControllerProvider);
                return ref.refresh(wishlistProductsProvider.future);
              },
              child: CustomScrollView(
                slivers: [
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  ...products.when(
                    loading: () => [const SliverProductGridSkeleton()],
                    error: (e, _) => [
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: ErrorView(error: e, onRetry: () => ref.invalidate(wishlistProductsProvider)),
                      ),
                    ],
                    data: (list) {
                      final visible = ids == null ? list : list.where((p) => ids.contains(p.id)).toList();
                      if (visible.isEmpty) {
                        return [
                          SliverFillRemaining(
                            hasScrollBody: false,
                            child: EmptyState(
                              icon: Icons.favorite_border_rounded,
                              title: 'Your wishlist is empty',
                              message: 'Tap the heart on any product to save it here.',
                              actionLabel: 'Explore products',
                              onAction: () => context.go('/'),
                            ),
                          ),
                        ];
                      }
                      return [
                        SliverProductGrid(products: visible, heroPrefix: 'wish'),
                        const SliverToBoxAdapter(child: SizedBox(height: 24)),
                      ];
                    },
                  ),
                ],
              ),
            ),
    );
  }
}
