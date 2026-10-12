# Royal Hires Android project — review notes

## Changes made in this pass
- Prevented PWA service-worker registration inside the native Capacitor app; browser/PWA registration remains enabled.
- Corrected storage documentation so the local IndexedDB/localStorage mirror is not described as a guarantee of zero data loss.
- Corrected the Profile screen's product description to avoid implying that the local storage mirror is cloud synchronization.

## Important limitations to resolve before real payroll use
- The sync service currently processes a local offline queue; it does not implement a remote server or multi-device cloud synchronization.
- Client-side profile/admin state is not a substitute for server-side authentication and authorization.
- Local browser/device storage can be cleared or lost. Export backups regularly and test restore.
- Do not put a private Gemini/API key in frontend source or a public repository.

## Build verification
A dependency install was attempted in the available environment but timed out, so a successful Vite build and APK build could not be verified here. The included GitHub Actions workflow is intended to build a debug APK in GitHub's cloud runner. Run it and inspect the build log before installing or using the APK.
