class Validators {
  const Validators._();

  static final _email = RegExp(r'^[\w.+\-]+@[\w\-]+(\.[\w\-]+)+$');
  static final _phone = RegExp(r'^[6-9]\d{9}$');
  static final _pincode = RegExp(r'^[1-9]\d{5}$');

  static String? required(String? v, [String field = 'This field']) =>
      (v == null || v.trim().isEmpty) ? '$field is required' : null;

  /// Django's UnicodeUsernameValidator: letters, digits and @ . + - _ only.
  static final _username = RegExp(r'^[\w.@+\-]+$', unicode: true);

  static String? username(String? v) {
    final value = (v ?? '').trim();
    if (value.isEmpty) return 'Username is required';
    if (value.length > 150) return 'Use 150 characters or fewer';
    if (!_username.hasMatch(value)) return 'Use letters, numbers and . _ - only (no spaces)';
    return null;
  }

  static String? email(String? v) {
    if (v == null || v.trim().isEmpty) return 'Email is required';
    if (!_email.hasMatch(v.trim())) return 'Enter a valid email address';
    return null;
  }

  static String? phone(String? v, {bool optional = false}) {
    final value = normalizePhone(v ?? '');
    if (value.isEmpty) return optional ? null : 'Mobile number is required';
    if (!_phone.hasMatch(value)) return 'Enter a valid 10-digit mobile number';
    return null;
  }

  static String? pincode(String? v) {
    final value = (v ?? '').trim();
    if (value.isEmpty) return 'PIN code is required';
    if (!_pincode.hasMatch(value)) return 'Enter a valid 6-digit PIN code';
    return null;
  }

  static String? loginPassword(String? v) =>
      (v == null || v.isEmpty) ? 'Password is required' : null;

  /// Registration minimum mirrors the backend serializer (min_length=8).
  static String? newPassword(String? v) {
    if (v == null || v.isEmpty) return 'Password is required';
    if (v.length < 8) return 'Use at least 8 characters';
    return null;
  }

  /// Change-password rules mirror ChangePasswordSerializer.validate_new_password.
  static String? strongPassword(String? v) {
    final base = newPassword(v);
    if (base != null) return base;
    if (!v!.contains(RegExp(r'[a-z]'))) return 'Add at least one lowercase letter';
    if (!v.contains(RegExp(r'[A-Z]'))) return 'Add at least one uppercase letter';
    if (!v.contains(RegExp(r'\d'))) return 'Add at least one number';
    return null;
  }

  static String normalizePhone(String v) {
    var digits = v.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length == 12 && digits.startsWith('91')) digits = digits.substring(2);
    if (digits.length == 11 && digits.startsWith('0')) digits = digits.substring(1);
    return digits;
  }
}
