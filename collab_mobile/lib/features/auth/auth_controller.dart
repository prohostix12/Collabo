import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers.dart';
import '../../data/models/user.dart';

/// Signed-in user, or null for guests. Restores the session from the
/// keystore on launch and falls back to the cached profile when offline.
class AuthController extends AsyncNotifier<AppUser?> {
  @override
  Future<AppUser?> build() async {
    final repo = ref.read(authRepositoryProvider);
    if (!repo.hasSession) return null;
    try {
      return await repo.fetchProfile();
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        await repo.logout();
        return null;
      }
      return repo.cachedUser;
    }
  }

  Future<void> login({required String email, required String password}) async {
    final user = await ref.read(authRepositoryProvider).login(email: email, password: password);
    state = AsyncData(user);
  }

  Future<void> register({
    required String email,
    required String username,
    required String password,
    String? phone,
    String? referralCode,
  }) async {
    final user = await ref.read(authRepositoryProvider).register(
          email: email,
          username: username,
          password: password,
          phone: phone,
          referralCode: referralCode,
        );
    state = AsyncData(user);
  }

  /// Re-reads reward points and profile fields after checkout or edits.
  Future<void> refreshProfile() async {
    if (state.value == null) return;
    try {
      state = AsyncData(await ref.read(authRepositoryProvider).fetchProfile());
    } on ApiException catch (_) {}
  }

  Future<void> updateProfile({required String username, required String phone}) async {
    final user = await ref.read(authRepositoryProvider).updateProfile(username: username, phone: phone);
    state = AsyncData(user);
  }

  Future<void> deleteAccount(String password) async {
    await ref.read(authRepositoryProvider).deleteAccount(password);
    state = const AsyncData(null);
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }

  void onSessionExpired() {
    if (state.value != null) state = const AsyncData(null);
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AppUser?>(AuthController.new);

final currentUserProvider = Provider<AppUser?>((ref) => ref.watch(authControllerProvider).value);

final isLoggedInProvider = Provider<bool>((ref) => ref.watch(currentUserProvider) != null);

/// Changes only when the signed-in account changes, so per-user providers
/// reset on login/logout without refetching on every profile refresh.
final currentUserIdProvider = Provider<int?>((ref) => ref.watch(currentUserProvider)?.id);
