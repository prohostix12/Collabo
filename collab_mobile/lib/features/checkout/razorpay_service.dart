import 'dart:async';
import 'dart:convert';

import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../data/repositories/order_repository.dart';

sealed class RazorpayOutcome {
  const RazorpayOutcome();
}

class RazorpaySuccess extends RazorpayOutcome {
  const RazorpaySuccess({required this.paymentId, required this.orderId, required this.signature});
  final String paymentId;
  final String orderId;
  final String signature;
}

class RazorpayCancelled extends RazorpayOutcome {
  const RazorpayCancelled();
}

class RazorpayFailed extends RazorpayOutcome {
  const RazorpayFailed(this.message);
  final String message;
}

/// Wraps the callback-based Razorpay SDK in a single awaitable checkout.
class RazorpayService {
  Future<RazorpayOutcome> checkout({
    required RazorpayOrder order,
    required String email,
    required String contact,
    required String name,
  }) {
    final razorpay = Razorpay();
    final completer = Completer<RazorpayOutcome>();

    void finish(RazorpayOutcome outcome) {
      if (!completer.isCompleted) completer.complete(outcome);
    }

    razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse r) {
      final paymentId = r.paymentId;
      final signature = r.signature;
      if (paymentId == null || signature == null) {
        finish(const RazorpayFailed('Payment response was incomplete. If money was debited, contact support.'));
        return;
      }
      finish(RazorpaySuccess(paymentId: paymentId, orderId: r.orderId ?? order.orderId, signature: signature));
    });
    razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse r) {
      if (r.code == Razorpay.PAYMENT_CANCELLED) {
        finish(const RazorpayCancelled());
      } else if (r.code == Razorpay.NETWORK_ERROR) {
        finish(const RazorpayFailed('Network error during payment. Please check your connection and retry.'));
      } else {
        finish(RazorpayFailed(_describe(r.message)));
      }
    });
    razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse r) {
      finish(RazorpayFailed(
        '${r.walletName ?? 'This wallet'} is not supported here. Please pick UPI, card or netbanking.',
      ));
    });

    try {
      razorpay.open({
        'key': order.keyId,
        'amount': order.amountPaise,
        'currency': order.currency,
        'order_id': order.orderId,
        'name': 'Collabo',
        'description': 'Secure order payment',
        'prefill': {
          'email': email,
          if (contact.isNotEmpty) 'contact': contact,
          if (name.isNotEmpty) 'name': name,
        },
        'theme': {'color': '#2874F0'},
        'retry': {'enabled': true, 'max_count': 3},
        'send_sms_hash': true,
      });
    } catch (_) {
      finish(const RazorpayFailed('Could not open the payment screen. Please try again.'));
    }

    return completer.future.whenComplete(razorpay.clear);
  }

  /// Razorpay sends failure details as a JSON string on Android.
  static String _describe(String? raw) {
    const fallback = 'Payment failed. Please try again.';
    if (raw == null || raw.isEmpty) return fallback;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        final error = decoded['error'];
        if (error is Map && error['description'] is String) return error['description'] as String;
        if (decoded['description'] is String) return decoded['description'] as String;
      }
    } catch (_) {
      return raw.length < 160 ? raw : fallback;
    }
    return fallback;
  }
}
