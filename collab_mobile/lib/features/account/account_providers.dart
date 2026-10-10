import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../data/models/address.dart';
import '../../data/models/wallet.dart';
import '../auth/auth_controller.dart';

class AddressesController extends AsyncNotifier<List<Address>> {
  @override
  Future<List<Address>> build() async {
    final userId = ref.watch(currentUserIdProvider);
    if (userId == null) return const [];
    return ref.read(addressRepositoryProvider).list();
  }

  Future<Address> save(Address address) async {
    final repo = ref.read(addressRepositoryProvider);
    final saved = address.id == null ? await repo.create(address) : await repo.update(address.id!, address);
    // Setting a default clears the flag on the others server-side; reload to reflect it.
    state = AsyncData(await repo.list());
    return saved;
  }

  Future<void> delete(int id) async {
    await ref.read(addressRepositoryProvider).delete(id);
    final current = state.value ?? const <Address>[];
    state = AsyncData(current.where((a) => a.id != id).toList());
  }
}

final addressesProvider =
    AsyncNotifierProvider<AddressesController, List<Address>>(AddressesController.new);

class DeliveryLocation {
  final String title;
  final String city;
  final String pincode;
  final String fullAddress;

  const DeliveryLocation({
    required this.title,
    required this.city,
    required this.pincode,
    this.fullAddress = '',
  });

  String get displayText {
    final parts = [
      if (title.isNotEmpty) title,
      if (city.isNotEmpty) city,
      if (pincode.isNotEmpty) pincode,
    ];
    if (parts.isEmpty) return 'Select Location';
    if (title.isNotEmpty && (city.isNotEmpty || pincode.isNotEmpty)) {
      return '$title - ${[city, pincode].where((s) => s.isNotEmpty).join(' ')}';
    }
    return parts.join(' ');
  }
}

class SelectedDeliveryLocation extends Notifier<DeliveryLocation?> {
  @override
  DeliveryLocation? build() => null;

  void select(DeliveryLocation? location) {
    state = location;
  }
}

final selectedDeliveryLocationProvider =
    NotifierProvider<SelectedDeliveryLocation, DeliveryLocation?>(SelectedDeliveryLocation.new);


final walletProvider = FutureProvider<Wallet>((ref) async {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) return Wallet.empty;
  return ref.read(walletRepositoryProvider).fetch();
});

