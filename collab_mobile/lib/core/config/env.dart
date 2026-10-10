/// Build-time configuration. Override with
/// `--dart-define=API_BASE_URL=https://staging.example.com/api`.
class Env {
  const Env._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://collabo.co.in/api',
  );

  static const String appName = 'Collabo';
  static const String supportEmail = 'support@collabo.co.in';
  static const String websiteUrl = 'https://collabo.co.in';

  /// Scheme + host (+ port) of the API, used to absolutize relative media paths.
  static final Uri origin = () {
    final uri = Uri.parse(apiBaseUrl);
    return Uri(
      scheme: uri.scheme,
      host: uri.host,
      port: uri.hasPort ? uri.port : null,
    );
  }();
}
