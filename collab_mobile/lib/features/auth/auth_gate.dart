import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'auth_controller.dart';

/// Returns true if the user is (or becomes) signed in. Guests are taken to
/// the login screen and brought back to where they were afterwards.
Future<bool> ensureSignedIn(BuildContext context, WidgetRef ref, {String? reason}) async {
  if (ref.read(isLoggedInProvider)) return true;
  final query = reason == null ? '' : '?reason=${Uri.encodeQueryComponent(reason)}';
  await context.push<bool>('/login$query');
  return ref.read(isLoggedInProvider);
}
