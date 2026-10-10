// Defensive JSON readers. DRF serializes DecimalFields as strings ("299.00"),
// and several product fields are free-form JSON authored in the admin.

double asDouble(dynamic v, [double fallback = 0]) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? fallback;
  return fallback;
}

double? asDoubleOrNull(dynamic v) {
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v);
  return null;
}

int asInt(dynamic v, [int fallback = 0]) => asIntOrNull(v) ?? fallback;

int? asIntOrNull(dynamic v) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? double.tryParse(v)?.toInt();
  return null;
}

String asString(dynamic v, [String fallback = '']) {
  if (v == null) return fallback;
  if (v is String) return v;
  return v.toString();
}

bool asBool(dynamic v, [bool fallback = false]) {
  if (v is bool) return v;
  if (v is num) return v != 0;
  if (v is String) return v.toLowerCase() == 'true' || v == '1';
  return fallback;
}

DateTime? asDate(dynamic v) {
  if (v is! String || v.isEmpty) return null;
  return DateTime.tryParse(v)?.toLocal();
}

List<Map<String, dynamic>> asMapList(dynamic v) {
  if (v is! List) return const [];
  return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
}

List<String> asStringList(dynamic v) {
  if (v is! List) return const [];
  return v
      .map((e) {
        if (e is String) return e.trim();
        if (e is Map) {
          for (final key in const ['title', 'text', 'description', 'name', 'value']) {
            final value = e[key];
            if (value is String && value.trim().isNotEmpty) return value.trim();
          }
        }
        return '';
      })
      .where((e) => e.isNotEmpty)
      .toList();
}

List<int> asIntList(dynamic v) {
  if (v is! List) return const [];
  return v.map(asIntOrNull).whereType<int>().toList();
}

Map<String, dynamic> asMap(dynamic v) =>
    v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};
