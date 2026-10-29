import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/address.dart';
import '../../data/models/order.dart';
import '../../features/account/account_screen.dart';
import '../../features/account/address_form_screen.dart';
import '../../features/account/addresses_screen.dart';
import '../../features/account/location_picker_screen.dart';
import '../../features/account/profile_screens.dart';
import '../../features/account/wallet_screen.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/catalog/categories_screen.dart';
import '../../features/catalog/product_list_screen.dart';
import '../../features/catalog/search_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/order_success_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/orders/order_detail_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/product/product_detail_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/wishlist/wishlist_screen.dart';
import '../../shared/widgets/product_widgets.dart';

final _rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');

const _protectedPrefixes = [
  '/checkout',
  '/orders',
  '/addresses',
  '/wallet',
  '/notifications',
  '/profile',
];

final routerProvider = Provider<GoRouter>((ref) {
  final authChanges = ValueNotifier<int?>(null);
  ref.listen<int?>(currentUserIdProvider, (_, id) => authChanges.value = id, fireImmediately: true);
  ref.onDispose(authChanges.dispose);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/',
    refreshListenable: authChanges,
    redirect: (context, state) {
      final loggedIn = ref.read(isLoggedInProvider);
      final path = state.matchedLocation;
      final isProtected = _protectedPrefixes.any((p) => path == p || path.startsWith('$p/'));
      if (isProtected && !loggedIn) {
        return '/login?from=${Uri.encodeQueryComponent(state.uri.toString())}';
      }
      return null;
    },
    errorBuilder: (context, state) => const _NotFoundScreen(),
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => MainShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/categories', builder: (_, _) => const CategoriesScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/account', builder: (_, _) => const AccountScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/cart', builder: (_, _) => const CartScreen()),
          ]),
        ],
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/wishlist',
        builder: (_, _) => const WishlistScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/product/:id',
        builder: (_, state) {
          final extra = state.extra is ProductRouteExtra ? state.extra as ProductRouteExtra : null;
          return ProductDetailScreen(
            productId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            initial: extra?.product,
            heroTag: extra?.heroTag,
          );
        },
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/products',
        builder: (_, state) => ProductListScreen(
          title: state.uri.queryParameters['title'],
          category: state.uri.queryParameters['category'],
          search: state.uri.queryParameters['search'],
          sort: state.uri.queryParameters['sort'],
          brand: state.uri.queryParameters['brand'],
          maxPrice: int.tryParse(state.uri.queryParameters['max'] ?? ''),
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/search',
        pageBuilder: (_, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const SearchScreen(),
          transitionsBuilder: (_, animation, _, child) =>
              FadeTransition(opacity: CurveTween(curve: Curves.easeOut).animate(animation), child: child),
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/login',
        builder: (_, state) => LoginScreen(
          from: state.uri.queryParameters['from'],
          reason: state.uri.queryParameters['reason'],
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/forgot-password',
        builder: (_, state) => ForgotPasswordScreen(email: state.uri.queryParameters['email']),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/register',
        builder: (_, state) => RegisterScreen(from: state.uri.queryParameters['from']),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/checkout',
        builder: (_, _) => const CheckoutScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/order-success',
        builder: (_, state) => OrderSuccessScreen(
          result: state.extra is PlacedOrder ? state.extra as PlacedOrder : null,
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/orders',
        builder: (_, _) => const OrdersScreen(),
        routes: [
          GoRoute(
            parentNavigatorKey: _rootKey,
            path: ':id',
            builder: (_, state) => OrderDetailScreen(
              orderId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
              initial: state.extra is Order ? state.extra as Order : null,
            ),
          ),
        ],
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/addresses',
        builder: (_, state) => AddressesScreen(selectMode: state.uri.queryParameters['select'] == '1'),
        routes: [
          GoRoute(
            parentNavigatorKey: _rootKey,
            path: 'edit',
            builder: (_, state) => AddressFormScreen(
              initial: state.extra is Address ? state.extra as Address : null,
            ),
          ),
          GoRoute(
            parentNavigatorKey: _rootKey,
            path: 'picker',
            builder: (_, state) => const LocationPickerScreen(),
          ),
        ],
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/wallet',
        builder: (_, _) => const WalletScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/notifications',
        builder: (_, _) => const NotificationsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/profile/edit',
        builder: (_, _) => const EditProfileScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootKey,
        path: '/profile/password',
        builder: (_, _) => const ChangePasswordScreen(),
      ),
    ],
  );
});

class _NotFoundScreen extends StatelessWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.explore_off_outlined, size: 48),
            const SizedBox(height: 12),
            const Text("This page doesn't exist"),
            const SizedBox(height: 16),
            FilledButton(onPressed: () => context.go('/'), child: const Text('Go home')),
          ],
        ),
      ),
    );
  }
}
