import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../core/theme/app_theme.dart';

class LocationResult {
  final String streetAddress;
  final String city;
  final String district;
  final String state;
  final String postalCode;
  final double latitude;
  final double longitude;

  const LocationResult({
    required this.streetAddress,
    required this.city,
    required this.district,
    required this.state,
    required this.postalCode,
    required this.latitude,
    required this.longitude,
  });

  String get fullFormatted {
    final parts = [streetAddress, city, district, state, postalCode]
        .where((s) => s.trim().isNotEmpty)
        .toList();
    return parts.join(', ');
  }
}

class LocationPickerScreen extends StatefulWidget {
  const LocationPickerScreen({
    super.key,
    this.initialLat = 20.5937, // Default center of India if GPS unavailable
    this.initialLng = 78.9629,
  });

  final double initialLat;
  final double initialLng;

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> {
  late final MapController _mapController = MapController();
  final Dio _dio = Dio(BaseOptions(
    headers: {'User-Agent': 'CollaboApp/1.0 (contact@collabo.co.in)'},
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  late LatLng _centerPosition = LatLng(widget.initialLat, widget.initialLng);
  bool _loadingLocation = false;
  bool _geocoding = false;
  Timer? _debounceTimer;

  String _streetAddress = '';
  String _city = '';
  String _district = '';
  String _state = '';
  String _postalCode = '';
  String _formattedDisplay = 'Move map pin to your location';

  @override
  void initState() {
    super.initState();
    _getCurrentLocation(initial: true);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _mapController.dispose();
    _dio.close();
    super.dispose();
  }

  Future<void> _getCurrentLocation({bool initial = false}) async {
    setState(() => _loadingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!initial && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enable location services (GPS) on your phone.')),
          );
        }
        setState(() => _loadingLocation = false);
        if (initial) _reverseGeocode(_centerPosition);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (!initial && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permission denied.')),
            );
          }
          setState(() => _loadingLocation = false);
          if (initial) _reverseGeocode(_centerPosition);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (!initial && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission is permanently denied in settings.')),
          );
        }
        setState(() => _loadingLocation = false);
        if (initial) _reverseGeocode(_centerPosition);
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );

      final newLatLng = LatLng(pos.latitude, pos.longitude);
      setState(() {
        _centerPosition = newLatLng;
      });

      _mapController.move(newLatLng, 16.5);
      _reverseGeocode(newLatLng);
    } catch (e) {
      if (!initial && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not fetch location: $e')),
        );
      }
      if (initial) _reverseGeocode(_centerPosition);
    } finally {
      if (mounted) setState(() => _loadingLocation = false);
    }
  }

  void _onPositionChanged(MapCamera camera, bool hasGesture) {
    _centerPosition = camera.center;
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 600), () {
      _reverseGeocode(_centerPosition);
    });
  }

  Future<void> _reverseGeocode(LatLng latLng) async {
    if (!mounted) return;
    setState(() => _geocoding = true);
    try {
      final res = await _dio.get(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'lat': latLng.latitude,
          'lon': latLng.longitude,
          'format': 'jsonv2',
          'addressdetails': 1,
        },
      );

      if (!mounted) return;
      if (res.data != null && res.data is Map) {
        final data = res.data as Map<String, dynamic>;
        final addr = (data['address'] as Map<String, dynamic>?) ?? {};

        // Parse street level
        final streetParts = [
          addr['house_number'],
          addr['building'],
          addr['amenity'],
          addr['road'],
          addr['suburb'] ?? addr['neighbourhood'] ?? addr['residential'],
        ].where((e) => e != null && e.toString().trim().isNotEmpty).map((e) => e.toString()).toList();

        _streetAddress = streetParts.isNotEmpty
            ? streetParts.join(', ')
            : (data['display_name']?.toString().split(',').first ?? '');

        _city = (addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['municipality'] ?? addr['suburb'] ?? '').toString();
        _district = (addr['county'] ?? addr['state_district'] ?? addr['district'] ?? _city).toString();
        _state = (addr['state'] ?? '').toString();
        _postalCode = (addr['postcode'] ?? '').toString();
        _formattedDisplay = data['display_name']?.toString() ?? _streetAddress;
      }
    } catch (_) {
      if (mounted) {
        _formattedDisplay = 'Selected Location (${latLng.latitude.toStringAsFixed(4)}, ${latLng.longitude.toStringAsFixed(4)})';
      }
    } finally {
      if (mounted) setState(() => _geocoding = false);
    }
  }

  void _confirm() {
    final result = LocationResult(
      streetAddress: _streetAddress,
      city: _city,
      district: _district,
      state: _state,
      postalCode: _postalCode,
      latitude: _centerPosition.latitude,
      longitude: _centerPosition.longitude,
    );
    Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select location on map'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Re-center map',
            onPressed: () => _getCurrentLocation(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // FlutterMap OpenStreetMap view
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _centerPosition,
              initialZoom: 15.0,
              minZoom: 4.0,
              maxZoom: 19.0,
              onPositionChanged: _onPositionChanged,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.collabo.app',
              ),
            ],
          ),

          // Fixed Center Pin Indicator
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 36),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.peacockBlue,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_on, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Deliver here',
                          style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Icon(
                    Icons.location_on,
                    size: 44,
                    color: AppTheme.peacockBlue,
                  ),
                ],
              ),
            ),
          ),

          // Top Info Banner
          Positioned(
            top: 12,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.92),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppTheme.peacockBlue),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Drag or zoom the map to position the pin exactly on your home/building.',
                      style: TextStyle(fontSize: 12, color: Colors.black87),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Floating GPS button
          Positioned(
            right: 16,
            bottom: 210,
            child: FloatingActionButton.small(
              heroTag: 'gps_btn',
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.peacockBlue,
              elevation: 4,
              onPressed: _loadingLocation ? null : () => _getCurrentLocation(),
              child: _loadingLocation
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.peacockBlue),
                    )
                  : const Icon(Icons.my_location),
            ),
          ),

          // Bottom Address Sheet Card
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 16,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.peacockBlue.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.location_on, color: AppTheme.peacockBlue, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _streetAddress.isNotEmpty ? _streetAddress : 'Location Selected',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              if (_geocoding)
                                const Row(
                                  children: [
                                    SizedBox(
                                      width: 12,
                                      height: 12,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.peacockBlue),
                                    ),
                                    SizedBox(width: 8),
                                    Text('Fetching address details...', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                )
                              else
                                Text(
                                  _formattedDisplay,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.peacockBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: _confirm,
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_outline, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Confirm Location',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
