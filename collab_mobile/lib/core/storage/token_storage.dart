import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Keeps JWTs and the cached user profile in the platform keystore, mirrored
/// in memory so the HTTP interceptor never awaits disk on every request.
class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  static const _kAccess = 'collabo.access_token';
  static const _kRefresh = 'collabo.refresh_token';
  static const _kUser = 'collabo.user';

  final FlutterSecureStorage _storage;

  String? _access;
  String? _refresh;
  Map<String, dynamic>? _user;

  String? get accessToken => _access;
  String? get refreshToken => _refresh;
  Map<String, dynamic>? get cachedUser => _user;
  bool get hasSession => _refresh != null || _access != null;

  Future<void> load() async {
    try {
      _access = await _storage.read(key: _kAccess);
      _refresh = await _storage.read(key: _kRefresh);
      final rawUser = await _storage.read(key: _kUser);
      _user = rawUser == null ? null : jsonDecode(rawUser) as Map<String, dynamic>;
    } catch (_) {
      // Keystore entries become unreadable after a backup restore onto a new
      // device; start clean rather than crash on launch.
      await clear();
    }
  }

  Future<void> saveTokens({required String access, String? refresh}) async {
    _access = access;
    await _storage.write(key: _kAccess, value: access);
    if (refresh != null) {
      _refresh = refresh;
      await _storage.write(key: _kRefresh, value: refresh);
    }
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    _user = user;
    await _storage.write(key: _kUser, value: jsonEncode(user));
  }

  Future<void> clear() async {
    _access = null;
    _refresh = null;
    _user = null;
    try {
      await Future.wait([
        _storage.delete(key: _kAccess),
        _storage.delete(key: _kRefresh),
        _storage.delete(key: _kUser),
      ]);
    } catch (_) {}
  }
}
