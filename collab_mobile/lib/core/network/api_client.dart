import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';

/// Thin Dio wrapper: attaches the JWT, transparently refreshes an expired
/// access token once per request, and converts failures into [ApiException].
class ApiClient {
  ApiClient(this._tokens, {Dio? dio, SharedPreferences? prefs})
      // ignore: prefer_initializing_formals
      : _prefs = prefs,
        dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: '${Env.apiBaseUrl}/',
                connectTimeout: const Duration(seconds: 10),
                receiveTimeout: const Duration(seconds: 30),
                sendTimeout: const Duration(seconds: 30),
                contentType: Headers.jsonContentType,
                responseType: ResponseType.json,
                headers: const {'Accept': 'application/json'},
              ),
            ) {
    this.dio.interceptors.add(
          InterceptorsWrapper(onRequest: _onRequest, onError: _onError),
        );
    if (kDebugMode) {
      this.dio.interceptors.add(
            LogInterceptor(requestBody: false, responseBody: false, logPrint: (o) => debugPrint('$o')),
          );
    }
  }

  final Dio dio;
  final TokenStorage _tokens;
  final SharedPreferences? _prefs;

  /// Storefront reads that are the same for everyone. The last good response
  /// is kept so a slow or dropped connection still shows the store.
  static const _cacheablePaths = {'ecommerce/store-settings/', 'ecommerce/categories/', 'ecommerce/brands/'};

  String? _cacheKey(String path, Map<String, dynamic>? query) =>
      _prefs != null && _cacheablePaths.contains(path) ? 'collabo.cache.$path${query ?? ''}' : null;

  /// Invoked when the refresh token is rejected and the session is gone.
  VoidCallback? onSessionExpired;

  Future<bool?>? _refreshing;

  void _onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _tokens.accessToken;
    if (token != null && options.extra['skipAuth'] != true) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(DioException err, ErrorInterceptorHandler handler) async {
    final options = err.requestOptions;
    final canRefresh = err.response?.statusCode == 401 &&
        options.extra['retried'] != true &&
        options.extra['skipAuth'] != true &&
        _tokens.refreshToken != null;

    if (!canRefresh) return handler.next(err);

    final refreshed = await _refreshOnce();
    if (refreshed == true) {
      options.extra['retried'] = true;
      options.headers['Authorization'] = 'Bearer ${_tokens.accessToken}';
      try {
        return handler.resolve(await dio.fetch<dynamic>(options));
      } on DioException catch (e) {
        return handler.next(e);
      }
    }
    if (refreshed == false) {
      await _tokens.clear();
      onSessionExpired?.call();
    }
    handler.next(err);
  }

  /// Shares one in-flight refresh between concurrent 401s.
  /// Returns true on success, false when the refresh token is invalid, and
  /// null on a network failure (the session is kept so the user isn't logged
  /// out just for being offline).
  Future<bool?> _refreshOnce() {
    return _refreshing ??= _refresh().whenComplete(() => _refreshing = null);
  }

  Future<bool?> _refresh() async {
    final refreshToken = _tokens.refreshToken;
    if (refreshToken == null) return false;
    try {
      final response = await Dio(BaseOptions(
        baseUrl: dio.options.baseUrl,
        connectTimeout: dio.options.connectTimeout,
        receiveTimeout: dio.options.receiveTimeout,
        contentType: Headers.jsonContentType,
      )).post<dynamic>('auth/token/refresh/', data: {'refresh': refreshToken});
      final data = response.data;
      final access = data is Map ? data['access'] as String? : null;
      if (access == null) return false;
      await _tokens.saveTokens(
        access: access,
        refresh: data['refresh'] as String?,
      );
      return true;
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      if (code == 400 || code == 401) return false;
      return null;
    }
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) async {
    final key = _cacheKey(path, query);
    try {
      final data = await _send(() => _getWithRetry(path, query, cancelToken));
      if (key != null) {
        try {
          await _prefs!.setString(key, jsonEncode(data));
        } catch (_) {/* cache is best effort */}
      }
      return data;
    } on ApiException catch (e) {
      if (key != null && e.isNetwork) {
        final cached = _prefs!.getString(key);
        if (cached != null) {
          try {
            return jsonDecode(cached);
          } catch (_) {/* fall through to the original error */}
        }
      }
      rethrow;
    }
  }

  /// GETs are safe to repeat, so one dropped connection is retried quietly.
  Future<Response<dynamic>> _getWithRetry(String path, Map<String, dynamic>? query, CancelToken? cancelToken) async {
    try {
      return await dio.get<dynamic>(path, queryParameters: query, cancelToken: cancelToken);
    } on DioException catch (e) {
      final transient = e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.connectionError;
      if (!transient) rethrow;
      await Future<void>.delayed(const Duration(milliseconds: 600));
      return dio.get<dynamic>(path, queryParameters: query, cancelToken: cancelToken);
    }
  }

  Future<dynamic> post(String path, {Object? data, bool skipAuth = false}) => _send(
        () => dio.post<dynamic>(
          path,
          data: data,
          options: Options(extra: {'skipAuth': skipAuth}),
        ),
      );

  Future<dynamic> put(String path, {Object? data}) =>
      _send(() => dio.put<dynamic>(path, data: data));

  Future<dynamic> patch(String path, {Object? data}) =>
      _send(() => dio.patch<dynamic>(path, data: data));

  Future<dynamic> delete(String path, {Object? data}) =>
      _send(() => dio.delete<dynamic>(path, data: data));

  Future<dynamic> _send(Future<Response<dynamic>> Function() call) async {
    try {
      final response = await call();
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
