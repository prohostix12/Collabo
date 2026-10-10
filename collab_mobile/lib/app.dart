import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/env.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_controller.dart';
import 'shared/widgets/offline_banner.dart';

class CollaboApp extends ConsumerWidget {
  const CollaboApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final auth = ref.watch(authControllerProvider);

    return MaterialApp.router(
      title: Env.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      themeMode: ThemeMode.light,
      routerConfig: router,
      builder: (context, child) {
        // Hold the first frame on a branded splash until the stored session
        // has been validated, so protected screens never flash for guests.
        if (auth.isLoading && !auth.hasValue) return const _Splash();
        return OfflineBanner(child: child ?? const SizedBox.shrink());
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/splash_logo_stacked.png',
              width: 380,
              height: 380,
              filterQuality: FilterQuality.high,
            ),
            const SizedBox(height: 20),
            const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(strokeWidth: 2.5)),
          ],
        ),
      ),
    );
  }
}
