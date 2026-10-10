import 'package:collabo/core/network/api_exception.dart';
import 'package:collabo/core/utils/validators.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

ApiException _fromResponse(int code, dynamic data) {
  final options = RequestOptions(path: '/x');
  return ApiException.fromDio(DioException(
    requestOptions: options,
    type: DioExceptionType.badResponse,
    response: Response(requestOptions: options, statusCode: code, data: data),
  ));
}

void main() {
  group('ApiException flattens DRF error shapes', () {
    test('{"error": ...} from custom views', () {
      expect(_fromResponse(400, {'error': 'Only 3 items left in stock'}).message, 'Only 3 items left in stock');
    });

    test('field errors from serializers', () {
      final e = _fromResponse(400, {
        'email': ['This email is already registered. Try logging in instead.'],
      });
      expect(e.message, startsWith('This email is already registered'));
      expect(e.fieldErrors['email'], isNotNull);
    });

    test('non_field_errors from login', () {
      expect(_fromResponse(400, {'non_field_errors': ['Invalid credentials']}).message, 'Invalid credentials');
    });

    test('server errors hide HTML bodies', () {
      final e = _fromResponse(500, '<html>Traceback</html>');
      expect(e.message, contains('Something went wrong'));
      expect(e.statusCode, 500);
    });

    test('connection failures are flagged as network errors', () {
      final e = ApiException.fromDio(DioException(
        requestOptions: RequestOptions(path: '/x'),
        type: DioExceptionType.connectionError,
      ));
      expect(e.isNetwork, isTrue);
      expect(isNetworkError(e), isTrue);
    });
  });

  group('Validators', () {
    test('phone accepts Indian mobiles with or without +91', () {
      expect(Validators.phone('9876543210'), isNull);
      expect(Validators.phone('+91 98765 43210'), isNull);
      expect(Validators.phone('12345'), isNotNull);
      expect(Validators.phone('', optional: true), isNull);
      expect(Validators.normalizePhone('+91-98765-43210'), '9876543210');
    });

    test('pincode must be 6 digits not starting with 0', () {
      expect(Validators.pincode('400001'), isNull);
      expect(Validators.pincode('012345'), isNotNull);
      expect(Validators.pincode('4000'), isNotNull);
    });

    test('change-password rules match ChangePasswordSerializer', () {
      expect(Validators.strongPassword('Passw0rdX'), isNull);
      expect(Validators.strongPassword('password1'), isNotNull);
      expect(Validators.strongPassword('PASSWORD1'), isNotNull);
      expect(Validators.strongPassword('Password'), isNotNull);
    });

    test('username follows Django UnicodeUsernameValidator', () {
      expect(Validators.username('mobile_qa.01'), isNull);
      expect(Validators.username('Mobile QA'), isNotNull);
      expect(Validators.username('name!'), isNotNull);
      expect(Validators.username(''), isNotNull);
    });

    test('email', () {
      expect(Validators.email('a.b+c@collabo.co.in'), isNull);
      expect(Validators.email('not-an-email'), isNotNull);
    });
  });
}
