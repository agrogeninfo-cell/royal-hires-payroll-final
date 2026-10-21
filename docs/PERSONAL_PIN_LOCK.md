# Royal Pay Personal PIN Lock

## Scope

The personal PIN is a local device-unlock layer for the installed Capacitor app. It does not replace Supabase sign-in, approved company profiles, role checks, factory assignments, or server-side Row Level Security.

## Implementation

- Secure storage dependency is pinned to `@aparajita/capacitor-secure-storage@7.0.0`, which declares Capacitor 7 dependencies.
- Android stores encrypted secure-storage values using Android Keystore-backed AES/GCM and app-private SharedPreferences.
- The raw PIN is not persisted. A random 16-byte salt and PBKDF2-HMAC-SHA-256 verifier (150,000 iterations) are stored instead.
- PIN length is 4–8 numeric digits.
- After five failed attempts, verification is paused for 60 seconds. The attempt counter and lockout deadline are stored in secure storage.
- The app locks when it transitions to the background or the WebView becomes hidden.
- The PIN gate is only enabled on native platforms. The plugin's web implementation uses unencrypted localStorage and is deliberately not used as a web security boundary.
- “Forgot PIN?” signs the user out and clears only PIN metadata. The user must authenticate with the existing Royal Pay cloud account again before creating a new PIN. It does not delete IndexedDB payroll data or backup records.

## Important limitations and verification

- The PIN is a local privacy barrier; it cannot protect data on a rooted/compromised device or replace device screen lock and Android OS security.
- If secure storage becomes unreadable, the gate fails closed rather than silently bypassing the PIN.
- Verify PIN setup, correct/incorrect PIN, five-attempt lockout, app background/resume, app restart, reset/re-authentication, offline access after unlock, and payroll/attendance/invoice regression on an Android device.
- Never clear app data as a PIN-recovery workaround: that may delete local IndexedDB records.
- Do not merge or release until CI succeeds and the APK is installed and smoke-tested on a device.
