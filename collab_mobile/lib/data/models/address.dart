import '../../core/utils/json.dart';

class Address {
  const Address({
    this.id,
    required this.name,
    required this.phone,
    required this.streetAddress,
    required this.city,
    required this.district,
    required this.state,
    required this.postalCode,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> j) => Address(
        id: asIntOrNull(j['id']),
        name: asString(j['name']),
        phone: asString(j['phone']),
        streetAddress: asString(j['street_address']),
        city: asString(j['city']),
        district: asString(j['district']),
        state: asString(j['state']),
        postalCode: asString(j['postal_code']),
        isDefault: asBool(j['is_default']),
      );

  final int? id;
  final String name;
  final String phone;
  final String streetAddress;
  final String city;
  final String district;
  final String state;
  final String postalCode;
  final bool isDefault;

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'street_address': streetAddress,
        'city': city,
        'district': district,
        'state': state,
        'postal_code': postalCode,
        'is_default': isDefault,
      };

  String get singleLine => [
        streetAddress,
        city,
        if (district.isNotEmpty && district != city) district,
        '$state - $postalCode',
      ].where((s) => s.trim().isNotEmpty).join(', ');
}
