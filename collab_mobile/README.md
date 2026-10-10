# Collabo mobile app

Flutter shopping app for [collabo.co.in](https://collabo.co.in). It talks to the existing Django API (`collab/backend`) with no backend changes.

## Run

```bash
flutter pub get
flutter run                                              # production API: https://collabo.co.in/api
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api   # local Django from the Android emulator
```

## Test

```bash
flutter analyze
flutter test
```

`test/checkout_pricing_test.dart` pins the client-side totals to `create_order_for_user` in `backend/ecommerce/views.py`. If you change pricing on the server (coupon rounding, delivery threshold, points or wallet rules), update `lib/features/checkout/domain/checkout_pricing.dart` and these tests. Otherwise the amount charged through Razorpay will differ from the order's `final_amount`.

## Release builds

1. Create an upload key once and keep it safe. Losing it blocks future Play Store updates.
   ```bash
   keytool -genkey -v -keystore ~/collabo-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Create `android/key.properties` (this file is git-ignored):
   ```properties
   storeFile=C:/Users/<you>/collabo-upload.jks
   storePassword=...
   keyAlias=upload
   keyPassword=...
   ```
3. Build:
   ```bash
   flutter build appbundle --release      # Play Store upload
   flutter build apk --release --split-per-abi   # sideloadable APKs
   ```

Without `key.properties`, release builds are signed with the debug key. They install fine but the Play Store rejects them.

Application ID: `in.co.collabo.app`. Bump `version:` in `pubspec.yaml` for every store upload.

## Structure

```
lib/
  core/        config, Dio client with JWT refresh, secure token storage, theme, router
  data/        models (parsed from the DRF serializers) and repositories (one per API area)
  features/    auth, home, catalog, product, cart, wishlist, checkout (Razorpay), orders,
               notifications, account. Each has its Riverpod providers and screens.
  shared/      reusable widgets: images (URL or base64), product cards and grids, empty/error states
```

## Backend notes

- **Razorpay:** the app calls `razorpay/create-order/`, opens the native checkout with the returned `key_id`, then posts the signature to `razorpay/verify-payment/`. That endpoint creates the order from the server-side cart. When the backend answers with `is_mock: true` (keys missing or the Razorpay call failed), release builds refuse to continue and ask the user to choose Cash on Delivery.
- **Notifications:** the backend has no notification API (updates go out over WhatsApp and email), so the in-app feed is built from the user's order timeline. Push notifications would need an FCM device-token endpoint on the backend.
