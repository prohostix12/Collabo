import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import '../../shared/widgets/feedback.dart';
import 'auth_controller.dart';
import 'auth_widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key, this.from});
  final String? from;

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _referral = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  bool _showReferral = false;
  String? _error;
  Map<String, String> _fieldErrors = const {};

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _password, _confirm, _referral]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _fieldErrors = const {};
    });
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(authControllerProvider.notifier).register(
            email: _email.text,
            username: _name.text,
            password: _password.text,
            phone: Validators.normalizePhone(_phone.text),
            referralCode: _referral.text,
          );
      TextInput.finishAutofillContext();
      if (!mounted) return;
      showAppSnack(context, 'Welcome to Collabo! You earned 10 reward points.');
      if (context.canPop()) {
        context.pop(true);
      } else {
        context.go(widget.from ?? '/');
      }
    } on ApiException catch (e) {
      HapticFeedback.mediumImpact();
      setState(() {
        _fieldErrors = e.fieldErrors;
        _error = e.fieldErrors.isEmpty ? e.message : null;
      });
      _formKey.currentState!.validate();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String? _server(String key) => _fieldErrors[key];

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Create your account',
      subtitle: 'Join Collabo for exclusive deals, rewards and fast delivery.',
      onClose: () => context.canPop() ? context.pop() : context.go('/'),
      child: AutofillGroup(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                FormErrorBanner(message: _error!),
                const SizedBox(height: AppSpacing.lg),
              ],
              TextFormField(
                controller: _name,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.newUsername],
                autocorrect: false,
                enabled: !_loading,
                inputFormatters: [FilteringTextInputFormatter.deny(RegExp(r'\s'))],
                decoration: const InputDecoration(
                  labelText: 'Username',
                  helperText: 'Letters, numbers and . _ - (no spaces)',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (v) => Validators.username(v) ?? _server('username'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                autocorrect: false,
                enabled: !_loading,
                decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.alternate_email_rounded)),
                validator: (v) => Validators.email(v) ?? _server('email'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumberNational],
                enabled: !_loading,
                maxLength: 10,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  labelText: 'Mobile number (optional)',
                  helperText: 'Get order updates on WhatsApp',
                  prefixIcon: Icon(Icons.phone_iphone_rounded),
                  prefixText: '+91 ',
                  counterText: '',
                ),
                validator: (v) => Validators.phone(v, optional: true) ?? _server('phone'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _password,
                obscureText: _obscure,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.newPassword],
                enabled: !_loading,
                decoration: InputDecoration(
                  labelText: 'Password',
                  helperText: 'At least 8 characters',
                  prefixIcon: const Icon(Icons.lock_outline_rounded),
                  suffixIcon: IconButton(
                    tooltip: _obscure ? 'Show password' : 'Hide password',
                    onPressed: () => setState(() => _obscure = !_obscure),
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  ),
                ),
                validator: (v) => Validators.newPassword(v) ?? _server('password'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _confirm,
                obscureText: _obscure,
                textInputAction: _showReferral ? TextInputAction.next : TextInputAction.done,
                enabled: !_loading,
                onFieldSubmitted: (_) => _showReferral ? null : _submit(),
                decoration: const InputDecoration(
                  labelText: 'Confirm password',
                  prefixIcon: Icon(Icons.lock_reset_rounded),
                ),
                validator: (v) => v != _password.text ? "Passwords don't match" : null,
              ),
              const SizedBox(height: AppSpacing.sm),
              AnimatedCrossFade(
                duration: const Duration(milliseconds: 220),
                crossFadeState: _showReferral ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                firstChild: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => setState(() => _showReferral = true),
                    icon: const Icon(Icons.card_giftcard_rounded, size: 18),
                    label: const Text('Have a referral code?'),
                  ),
                ),
                secondChild: Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.sm),
                  child: TextFormField(
                    controller: _referral,
                    textCapitalization: TextCapitalization.characters,
                    textInputAction: TextInputAction.done,
                    enabled: !_loading,
                    onFieldSubmitted: (_) => _submit(),
                    decoration: const InputDecoration(
                      labelText: 'Referral code (optional)',
                      prefixIcon: Icon(Icons.card_giftcard_rounded),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              LoadingButton(label: 'Create account', loading: _loading, onPressed: _submit),
              const SizedBox(height: AppSpacing.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Already have an account?', style: context.text.bodyMedium),
                  TextButton(
                    onPressed: _loading
                        ? null
                        : () {
                            final from = widget.from;
                            context.pushReplacement(
                              from == null ? '/login' : '/login?from=${Uri.encodeQueryComponent(from)}',
                            );
                          },
                    child: const Text('Sign in'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
