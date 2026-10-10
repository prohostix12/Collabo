import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/providers.dart';
import 'core/storage/token_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  final tokens = TokenStorage();
  final results = await Future.wait([
    tokens.load(),
    SharedPreferences.getInstance(),
  ]);

  runApp(
    ProviderScope(
      // Failures surface as error states with a retry button instead of
      // silent background retries.
      retry: (retryCount, error) => null,
      overrides: [
        tokenStorageProvider.overrideWithValue(tokens),
        sharedPreferencesProvider.overrideWithValue(results[1] as SharedPreferences),
      ],
      child: const CollaboApp(),
    ),
  );
}
