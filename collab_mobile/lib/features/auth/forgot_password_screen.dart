import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import 'auth_widgets.dart';

/// Asks the backend to email a one-time reset link. The link opens the Collabo
/// website's "Set new password" page in the phone's browser.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key, this.email});

  /// Pre-filled from the sign-in form.
  final String? email;

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  static const _cooldown = 60;

  final _formKey = GlobalKey<FormState>();
  late final _email = TextEditingController(text: widget.email ?? '');
  bool _loading = false;
  bool _sent = false;
  String? _error;
  int _secondsLeft = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _email.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _secondsLeft = _cooldown);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _secondsLeft--);
      if (_secondsLeft <= 0) t.cancel();
    });
  }

  Future<void> _send() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    if (!_sent && !_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authRepositoryProvider).requestPasswordReset(_email.text);
      if (!mounted) return;
      HapticFeedback.lightImpact();
      setState(() => _sent = true);
      _startCooldown();
    } on ApiException catch (e) {
      HapticFeedback.mediumImpact();
      setState(() => _error = e.statusCode == 429 ? 'Too many requests. Please try again later.' : e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _close() => context.canPop() ? context.pop() : context.go('/login');

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: _sent ? 'Check your email' : 'Forgot password?',
      subtitle: _sent
          ? 'Password reset link sent'
          : "Enter your email and we'll send you a link to reset your password.",
      onClose: _close,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _sent ? _buildSent(context) : _buildForm(context),
      ),
    );
  }

  Widget _buildForm(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        key: const ValueKey('form'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_error != null) ...[
            FormErrorBanner(message: _error!),
            const SizedBox(height: AppSpacing.lg),
          ],
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.email],
            autocorrect: false,
            enabled: !_loading,
            onFieldSubmitted: (_) => _send(),
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.alternate_email_rounded),
            ),
            validator: Validators.email,
          ),
          const SizedBox(height: AppSpacing.xl),
          LoadingButton(label: 'Send reset link', loading: _loading, onPressed: _send),
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: _loading ? null : _close,
            child: const Text('Back to sign in'),
          ),
        ],
      ),
    );
  }

  Widget _buildSent(BuildContext context) {
    final canResend = _secondsLeft <= 0 && !_loading;
    return Column(
      key: const ValueKey('sent'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null) ...[
          FormErrorBanner(message: _error!),
          const SizedBox(height: AppSpacing.lg),
        ],
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(color: Color(0xFFFFF1EA), shape: BoxShape.circle),
            child: const Icon(Icons.mark_email_read_outlined, size: 36, color: AppColors.cta),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text.rich(
          TextSpan(
            style: context.text.bodyMedium?.copyWith(color: context.palette.mutedText, height: 1.4),
            children: [
              const TextSpan(text: 'If an account exists for\n'),
              TextSpan(
                text: _email.text.trim(),
                style: context.text.bodyMedium?.copyWith(fontWeight: FontWeight.w800, color: context.colors.onSurface),
              ),
              const TextSpan(text: ",\nwe've sent a link to reset your password."),
            ],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.lg),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: context.palette.subtleSurface, borderRadius: BorderRadius.circular(8)),
          child: Text(
            '• Open the link on this phone to choose a new password.\n'
            '• The link works once and expires soon.\n'
            "• Can't find it? Check your spam or junk folder.",
            style: context.text.bodySmall?.copyWith(color: context.palette.mutedText, height: 1.5),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        OutlinedButton(
          onPressed: canResend ? _send : null,
          child: Text(_secondsLeft > 0 ? 'Resend link in ${_secondsLeft}s' : 'Resend link'),
        ),
        const SizedBox(height: AppSpacing.md),
        FilledButton(onPressed: _close, child: const Text('Back to sign in')),
      ],
    );
  }
}
