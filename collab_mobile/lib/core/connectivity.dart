import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// True while the device reports no network interface at all.
final isOfflineProvider = StreamProvider<bool>((ref) async* {
  final connectivity = Connectivity();
  bool offline(List<ConnectivityResult> r) => r.isEmpty || r.every((e) => e == ConnectivityResult.none);
  yield offline(await connectivity.checkConnectivity());
  yield* connectivity.onConnectivityChanged.map(offline).distinct();
});
