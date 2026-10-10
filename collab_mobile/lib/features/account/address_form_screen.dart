import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/validators.dart';
import '../../data/models/address.dart';
import '../../shared/widgets/feedback.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_widgets.dart';
import 'account_providers.dart';
import 'location_picker_screen.dart';

const _indianStates = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({super.key, this.initial});
  final Address? initial;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.initial?.name ?? ref.read(currentUserProvider)?.username ?? '');
  late final _phone = TextEditingController(text: widget.initial?.phone ?? ref.read(currentUserProvider)?.phone ?? '');
  late final _street = TextEditingController(text: widget.initial?.streetAddress ?? '');
  late final _city = TextEditingController(text: widget.initial?.city ?? '');
  late final _district = TextEditingController(text: widget.initial?.district ?? '');
  late final _pin = TextEditingController(text: widget.initial?.postalCode ?? '');
  late String? _state = _indianStates.contains(widget.initial?.state) ? widget.initial!.state : null;
  late bool _isDefault = widget.initial?.isDefault ?? (ref.read(addressesProvider).value?.isEmpty ?? true);
  bool _saving = false;
  Map<String, String> _fieldErrors = const {};

  bool get _editing => widget.initial?.id != null;

  @override
  void dispose() {
    for (final c in [_name, _phone, _street, _city, _district, _pin]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() => _fieldErrors = const {});
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final saved = await ref.read(addressesProvider.notifier).save(Address(
            id: widget.initial?.id,
            name: _name.text.trim(),
            phone: Validators.normalizePhone(_phone.text),
            streetAddress: _street.text.trim(),
            city: _city.text.trim(),
            district: _district.text.trim().isEmpty ? _city.text.trim() : _district.text.trim(),
            state: _state!,
            postalCode: _pin.text.trim(),
            isDefault: _isDefault,
          ));
      if (!mounted) return;
      showAppSnack(context, _editing ? 'Address updated' : 'Address saved');
      context.pop(saved);
    } on ApiException catch (e) {
      setState(() => _fieldErrors = e.fieldErrors);
      if (e.fieldErrors.isEmpty && mounted) showErrorSnack(context, e);
      _formKey.currentState!.validate();
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _selectLocationFromMap() async {
    final LocationResult? result = await Navigator.of(context).push<LocationResult>(
      MaterialPageRoute(builder: (_) => const LocationPickerScreen()),
    );

    if (result != null && mounted) {
      setState(() {
        if (result.streetAddress.isNotEmpty) {
          _street.text = result.streetAddress;
        }
        if (result.city.isNotEmpty) {
          _city.text = result.city;
        }
        if (result.district.isNotEmpty) {
          _district.text = result.district;
        }
        if (result.postalCode.isNotEmpty) {
          _pin.text = result.postalCode;
        }
        if (result.state.isNotEmpty) {
          for (final s in _indianStates) {
            if (s.toLowerCase() == result.state.toLowerCase() ||
                result.state.toLowerCase().contains(s.toLowerCase()) ||
                s.toLowerCase().contains(result.state.toLowerCase())) {
              _state = s;
              break;
            }
          }
        }
      });

      showAppSnack(context, 'Address details auto-filled from map!');
    }
  }

  String? _server(String key) => _fieldErrors[key];

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: AppSpacing.md);
    return Scaffold(
      appBar: AppBar(title: Text(_editing ? 'Edit address' : 'New address')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Form(
            key: _formKey,
            child: AutofillGroup(
              child: ListView(
                padding: const EdgeInsets.all(16),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                children: [
                  // Interactive Map Location Selector Card
                  Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: AppSpacing.md),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: AppTheme.peacockBlue.withOpacity(0.25), width: 1.5),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.peacockBlue.withOpacity(0.08),
                            AppTheme.saffronOrange.withOpacity(0.06),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppTheme.peacockBlue, AppTheme.peacockDark],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.location_on_outlined, color: Colors.white, size: 22),
                        ),
                        title: const Text(
                          'Select current address via Map',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: AppTheme.peacockBlue,
                          ),
                        ),
                        subtitle: const Text(
                          'Use GPS & pin point location to auto-fill address',
                          style: TextStyle(fontSize: 12, color: Colors.black87),
                        ),
                        trailing: const Icon(Icons.chevron_right, color: AppTheme.peacockBlue),
                        onTap: _saving ? null : _selectLocationFromMap,
                      ),
                    ),
                  ),
                  TextFormField(
                    controller: _name,
                    enabled: !_saving,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.name],
                    decoration: const InputDecoration(labelText: 'Full name'),
                    validator: (v) => Validators.required(v, 'Name') ?? _server('name'),
                  ),
                  gap,
                  TextFormField(
                    controller: _phone,
                    enabled: !_saving,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.telephoneNumberNational],
                    maxLength: 10,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Mobile number', prefixText: '+91 ', counterText: ''),
                    validator: (v) => Validators.phone(v) ?? _server('phone'),
                  ),
                  gap,
                  TextFormField(
                    controller: _street,
                    enabled: !_saving,
                    textCapitalization: TextCapitalization.sentences,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.fullStreetAddress],
                    minLines: 2,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'House no., building, street, area'),
                    validator: (v) => Validators.required(v, 'Address') ?? _server('street_address'),
                  ),
                  gap,
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _pin,
                          enabled: !_saving,
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.postalCode],
                          maxLength: 6,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          decoration: const InputDecoration(labelText: 'PIN code', counterText: ''),
                          validator: (v) => Validators.pincode(v) ?? _server('postal_code'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _city,
                          enabled: !_saving,
                          textCapitalization: TextCapitalization.words,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.addressCity],
                          decoration: const InputDecoration(labelText: 'City / Town'),
                          validator: (v) => Validators.required(v, 'City') ?? _server('city'),
                        ),
                      ),
                    ],
                  ),
                  gap,
                  TextFormField(
                    controller: _district,
                    enabled: !_saving,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'District (optional)'),
                  ),
                  gap,
                  DropdownButtonFormField<String>(
                    initialValue: _state,
                    isExpanded: true,
                    menuMaxHeight: 400,
                    decoration: const InputDecoration(labelText: 'State'),
                    items: [for (final s in _indianStates) DropdownMenuItem(value: s, child: Text(s))],
                    onChanged: _saving ? null : (v) => setState(() => _state = v),
                    validator: (v) => v == null ? 'Select a state' : _server('state'),
                  ),
                  gap,
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Make this my default address'),
                    value: _isDefault,
                    onChanged: _saving ? null : (v) => setState(() => _isDefault = v),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  LoadingButton(label: _editing ? 'Update address' : 'Save address', loading: _saving, onPressed: _save),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
