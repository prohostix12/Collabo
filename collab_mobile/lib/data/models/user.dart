import '../../core/utils/json.dart';

class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.username,
    required this.userType,
    required this.phone,
    required this.rewardPoints,
    required this.affiliateCode,
    required this.createdAt,
    required this.raw,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: asInt(j['id']),
        email: asString(j['email']),
        username: asString(j['username']),
        userType: asString(j['user_type'], 'buyer'),
        phone: asString(j['phone']),
        rewardPoints: asInt(j['reward_points']),
        affiliateCode: asString(j['affiliate_code']),
        createdAt: asDate(j['created_at']),
        raw: j,
      );

  final int id;
  final String email;
  final String username;
  final String userType;
  final String phone;
  final int rewardPoints;
  final String affiliateCode;
  final DateTime? createdAt;

  /// Original payload, persisted so the app can start offline.
  final Map<String, dynamic> raw;

  String get displayName => username.isNotEmpty ? username : email.split('@').first;

  String get initials {
    final parts = displayName.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  /// The backend only redeems points once the balance reaches 100.
  bool get canRedeemPoints => rewardPoints >= 100;
}
