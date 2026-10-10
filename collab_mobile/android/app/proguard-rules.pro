# Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/android-integration/standard/)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
    public void onPayment*(...);
}

# Google Pay / Play Core classes referenced optionally by Razorpay and Flutter
-dontwarn com.google.android.apps.nbu.paisa.inapp.client.api.**
-dontwarn com.google.android.play.core.**
-dontwarn proguard.annotation.Keep
-dontwarn proguard.annotation.KeepClassMembers
