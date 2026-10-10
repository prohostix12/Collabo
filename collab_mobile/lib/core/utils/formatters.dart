import 'package:intl/intl.dart';

final _inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _inrPrecise = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
final _date = DateFormat('d MMM yyyy');
final _dateTime = DateFormat('d MMM yyyy, h:mm a');
final _short = DateFormat('EEE, d MMM');

/// ₹1,299 for whole rupees, ₹1,299.50 when paise are present.
String formatPrice(num value) {
  final hasPaise = (value * 100).round() % 100 != 0;
  return hasPaise ? _inrPrecise.format(value) : _inr.format(value);
}

String formatDate(DateTime? d) => d == null ? '' : _date.format(d);
String formatDateTime(DateTime? d) => d == null ? '' : _dateTime.format(d);
String formatShortDate(DateTime? d) => d == null ? '' : _short.format(d);

String formatRelative(DateTime d) {
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return formatDate(d);
}

String capitalize(String s) =>
    s.isEmpty ? s : s[0].toUpperCase() + s.substring(1).replaceAll('_', ' ');
