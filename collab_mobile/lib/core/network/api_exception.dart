import 'package:dio/dio.dart';

class ApiException implements Exception {
  ApiException(
    this.message, {
    this.statusCode,
    this.fieldErrors = const {},
    this.isNetwork = false,
  });

  factory ApiException.fromDio(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          'The connection timed out. Check your internet and try again.',
          isNetwork: true,
        );
      case DioExceptionType.connectionError:
        return ApiException(
          "You're offline. Check your internet connection and try again.",
          isNetwork: true,
        );
      case DioExceptionType.cancel:
        return ApiException('Request cancelled');
      default:
        break;
    }

    final response = e.response;
    if (response == null) {
      return ApiException(
        'Unable to reach Collabo. Please try again.',
        isNetwork: true,
      );
    }

    final code = response.statusCode ?? 0;
    final fields = <String, String>{};
    final serverMessage = _extract(response.data, fields);

    String fallback;
    if (code == 401) {
      fallback = 'Please sign in to continue.';
    } else if (code == 403) {
      fallback = "You don't have permission to do that.";
    } else if (code == 404) {
      fallback = "We couldn't find what you were looking for.";
    } else if (code == 429) {
      fallback = 'Too many requests. Please wait a moment and retry.';
    } else if (code >= 500) {
      fallback = 'Something went wrong on our side. Please try again shortly.';
    } else {
      fallback = 'Something went wrong. Please try again.';
    }

    return ApiException(
      code >= 500 ? fallback : (serverMessage ?? fallback),
      statusCode: code,
      fieldErrors: fields,
    );
  }

  final String message;
  final int? statusCode;
  final Map<String, String> fieldErrors;
  final bool isNetwork;

  bool get isUnauthorized => statusCode == 401;
  bool get isNotFound => statusCode == 404;

  /// Flattens DRF's error shapes: {"error": ".."}, {"detail": ".."},
  /// {"field": ["msg"]}, {"non_field_errors": [..]}, or a bare ["msg"].
  static String? _extract(dynamic data, Map<String, String> fields) {
    if (data == null) return null;
    if (data is String) {
      final text = data.trim();
      if (text.isEmpty || text.startsWith('<') || text.length > 240) return null;
      return text;
    }
    if (data is List) {
      for (final item in data) {
        final msg = _extract(item, fields);
        if (msg != null) return msg;
      }
      return null;
    }
    if (data is Map) {
      for (final key in const ['error', 'detail', 'message', 'non_field_errors']) {
        if (data.containsKey(key)) {
          final msg = _extract(data[key], <String, String>{});
          if (msg != null) return msg;
        }
      }
      String? first;
      data.forEach((key, value) {
        if (key == 'traceback') return;
        final msg = _extract(value, <String, String>{});
        if (msg != null) {
          fields['$key'] = msg;
          first ??= msg;
        }
      });
      return first;
    }
    return null;
  }

  @override
  String toString() => message;
}

/// User-facing text for any error thrown from the data layer.
String describeError(Object? error) {
  if (error is ApiException) return error.message;
  return 'Something went wrong. Please try again.';
}

bool isNetworkError(Object? error) => error is ApiException && error.isNetwork;
