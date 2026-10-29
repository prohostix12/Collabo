import '../../core/network/api_client.dart';
import '../../core/storage/token_storage.dart';
import '../../core/utils/json.dart';
import '../models/user.dart';

class AuthRepository {
  AuthRepository(this._api, this._tokens);

  final ApiClient _api;
  final TokenStorage _tokens;

  AppUser? get cachedUser {
    final raw = _tokens.cachedUser;
    return raw == null ? null : AppUser.fromJson(raw);
  }

  bool get hasSession => _tokens.hasSession;

  Future<AppUser> login({required String email, required String password}) async {
    final data = await _api.post(
      'auth/login/',
      data: {'email': email.trim().toLowerCase(), 'password': password},
      skipAuth: true,
    );
    return _persistSession(data);
  }

  /// Shoppers register as `buyer`, matching the web storefront's sign-up.
  Future<AppUser> register({
    required String email,
    required String username,
    required String password,
    String? phone,
    String? referralCode,
  }) async {
    final data = await _api.post(
      'auth/register/',
      data: {
        'email': email.trim().toLowerCase(),
        'username': username.trim(),
        'password': password,
        'password_confirm': password,
        'user_type': 'buyer',
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (referralCode != null && referralCode.trim().isNotEmpty)
          'referred_by_code': referralCode.trim(),
      },
      skipAuth: true,
    );
    return _persistSession(data);
  }

  /// Emails a one-time reset link. The server answers the same way whether or
  /// not the address has an account, so this never reveals who is registered.
  Future<void> requestPasswordReset(String email) async {
    await _api.post(
      'auth/password-reset/',
      data: {'email': email.trim().toLowerCase()},
      skipAuth: true,
    );
  }

  Future<AppUser> fetchProfile() async {
    final data = asMap(await _api.get('auth/profile/'));
    await _tokens.saveUser(data);
    return AppUser.fromJson(data);
  }

  Future<AppUser> updateProfile({required String username, required String phone}) async {
    final data = asMap(await _api.patch(
      'auth/profile/',
      data: {'username': username.trim(), 'phone': phone.trim()},
    ));
    await _tokens.saveUser(data);
    return AppUser.fromJson(data);
  }

  Future<void> changePassword({required String oldPassword, required String newPassword}) =>
      _api.post('auth/change-password/', data: {
        'old_password': oldPassword,
        'new_password': newPassword,
      });

  Future<void> deleteAccount(String password) async {
    await _api.post('auth/delete-account/', data: {'password': password});
    await _tokens.clear();
  }

  Future<void> logout() => _tokens.clear();

  Future<AppUser> _persistSession(dynamic data) async {
    final map = asMap(data);
    final user = asMap(map['user']);
    await _tokens.saveTokens(
      access: asString(map['access']),
      refresh: asString(map['refresh']),
    );
    await _tokens.saveUser(user);
    return AppUser.fromJson(user);
  }
}
