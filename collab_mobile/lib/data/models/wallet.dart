import '../../core/utils/json.dart';

class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.amount,
    required this.status,
    required this.reason,
    required this.productName,
    required this.orderId,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> j) => WalletTransaction(
        id: asString(j['id']),
        amount: asDouble(j['amount']),
        status: asString(j['status']),
        reason: asString(j['reason']),
        productName: asString(j['product_name']),
        orderId: asString(j['order']),
        createdAt: asDate(j['created_at']),
      );

  final String id;
  final double amount;
  final String status;
  final String reason;
  final String productName;
  final String orderId;
  final DateTime? createdAt;

  bool get isCredit => amount >= 0;
}

class Wallet {
  const Wallet({required this.balance, required this.pending, required this.transactions});

  factory Wallet.fromJson(dynamic json) {
    final j = asMap(json);
    return Wallet(
      balance: asDouble(j['balance']),
      pending: asDouble(j['pending']),
      transactions: asMapList(j['transactions']).map(WalletTransaction.fromJson).toList(),
    );
  }

  static const empty = Wallet(balance: 0, pending: 0, transactions: []);

  final double balance;
  final double pending;
  final List<WalletTransaction> transactions;
}
