import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import '../../shared/widgets/feedback.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_widgets.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: ref.read(currentUserProvider)?.username ?? '');
  late final _phone = TextEditingController(text: ref.read(currentUserProvider)?.phone ?? '');
  bool _saving = false;
  Map<String, String> _fieldErrors = const {};

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _fieldErrors = const {});
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(authControllerProvider.notifier).updateProfile(
            username: _name.text,
            phone: Validators.normalizePhone(_phone.text),
          );
      if (!mounted) return;
      showAppSnack(context, 'Profile updated');
      context.pop();
    } on ApiException catch (e) {
      setState(() => _fieldErrors = e.fieldErrors);
      if (e.fieldErrors.isEmpty && mounted) showErrorSnack(context, e);
      _formKey.currentState!.validate();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = ref.watch(currentUserProvider)?.email ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextFormField(
                  initialValue: email,
                  enabled: false,
                  decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.alternate_email_rounded)),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _name,
                  enabled: !_saving,
                  autocorrect: false,
                  inputFormatters: [FilteringTextInputFormatter.deny(RegExp(r'\s'))],
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    helperText: 'Letters, numbers and . _ - (no spaces)',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (v) => Validators.username(v) ?? _fieldErrors['username'],
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _phone,
                  enabled: !_saving,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    labelText: 'Mobile number',
                    prefixText: '+91 ',
                    prefixIcon: Icon(Icons.phone_iphone_rounded),
                    counterText: '',
                  ),
                  validator: (v) => Validators.phone(v, optional: true) ?? _fieldErrors['phone'],
                ),
                const SizedBox(height: AppSpacing.xl),
                LoadingButton(label: 'Save changes', loading: _saving, onPressed: _save),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _old = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  bool _obscure = true;
  Map<String, String> _fieldErrors = const {};

  @override
  void dispose() {
    _old.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _fieldErrors = const {});
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(authRepositoryProvider).changePassword(oldPassword: _old.text, newPassword: _new.text);
      if (!mounted) return;
      showAppSnack(context, 'Password updated');
      context.pop();
    } on ApiException catch (e) {
      setState(() => _fieldErrors = e.fieldErrors);
      if (e.fieldErrors.isEmpty && mounted) showErrorSnack(context, e);
      _formKey.currentState!.validate();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    InputDecoration deco(String label) => InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.lock_outline_rounded),
          suffixIcon: IconButton(
            tooltip: _obscure ? 'Show passwords' : 'Hide passwords',
            onPressed: () => setState(() => _obscure = !_obscure),
            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
          ),
        );

    return Scaffold(
      appBar: AppBar(title: const Text('Change password')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Form(
            key: _formKey,
            child: AutofillGroup(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _old,
                    obscureText: _obscure,
                    autofillHints: const [AutofillHints.password],
                    decoration: deco('Current password'),
                    validator: (v) => Validators.loginPassword(v) ?? _fieldErrors['old_password'],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _new,
                    obscureText: _obscure,
                    autofillHints: const [AutofillHints.newPassword],
                    decoration: deco('New password').copyWith(
                      helperText: '8+ characters with upper & lower case letters and a number',
                      helperMaxLines: 2,
                    ),
                    validator: (v) => Validators.strongPassword(v) ?? _fieldErrors['new_password'],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _confirm,
                    obscureText: _obscure,
                    decoration: deco('Confirm new password'),
                    validator: (v) => v != _new.text ? "Passwords don't match" : null,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  LoadingButton(label: 'Update password', loading: _saving, onPressed: _save),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Play Store requires in-app account deletion; uses the existing
/// password-confirmed endpoint.
Future<void> showDeleteAccountDialog(BuildContext context, WidgetRef ref) async {
  final deleted = await showDialog<bool>(context: context, builder: (_) => const _DeleteAccountDialog());
  if (deleted == true && context.mounted) showAppSnack(context, 'Your account has been deleted');
}

class _DeleteAccountDialog extends ConsumerStatefulWidget {
  const _DeleteAccountDialog();

  @override
  ConsumerState<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends ConsumerState<_DeleteAccountDialog> {
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    if (_password.text.isEmpty) {
      setState(() => _error = 'Password is required');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authControllerProvider.notifier).deleteAccount(_password.text);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = e.fieldErrors['password'] ?? e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: Icon(Icons.warning_amber_rounded, color: context.colors.error, size: 36),
      title: const Text('Delete your account?'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'This permanently deletes your Collabo account, saved addresses, '
            'reward points and wallet balance. This cannot be undone.',
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _password,
            obscureText: true,
            enabled: !_busy,
            autofillHints: const [AutofillHints.password],
            onSubmitted: (_) => _delete(),
            decoration: InputDecoration(labelText: 'Enter your password to confirm', errorText: _error),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: _busy ? null : () => Navigator.pop(context, false), child: const Text('Cancel')),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: context.colors.error,
            foregroundColor: context.colors.onError,
          ),
          onPressed: _busy ? null : _delete,
          child: _busy
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Delete'),
        ),
      ],
    );
  }
}

