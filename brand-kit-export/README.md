# ROYAL HIRES — Brand Asset Kit

## Primary visual system
- Deep Emerald: `#064E3B`
- Forest Green: `#073C2B`
- Secondary Emerald: `#0B6B4C`
- Soft Mint: `#76CDA8`
- Champagne Gold Accent: `#C9A544`
- Ivory: `#F9FBF9`
- Matte Black: `#111714`

## Included assets
- `app-icon/royal-hires-app-icon-1024.png`: master icon, emerald background + white symbol only (no wording).
- `app-icon/royal-hires-app-icon-512.png` and `192.png`: scaled app/PWA icons.
- `app-icon/royal-hires-maskable-512.png`: Android/PWA mask-safe icon.
- `splash-screen/royal-hires-splash-1080x2400.png`: mobile portrait splash.
- `splash-screen/royal-hires-splash-square-1200.png`: square art master.
- `company-logo/royal-hires-full-company-logo-1600x600.png`: primary transparent horizontal company logo.
- `company-logo/royal-hires-full-company-logo-white-1600x600.png`: reverse white wordmark for dark backgrounds.
- `company-logo/royal-hires-full-company-logo.svg`: scalable SVG lockup.
- `company-logo/logo-mark-*.png`: symbol-only color variations.
- `company-logo/royal-hires-social-cover-1920x1080.png`: social/brand cover.
- `android-assets/`: launcher icon resources and adaptive icon inputs for Android packaging.

## Use
Use the icon-only master on app launchers; do not add text under the symbol. Prefer the full logo for documents, website headers, and official communication. Keep clear space around the mark. Use the white logo only on dark/emerald backgrounds. The splash is artwork for the first screen, not a screenshot of an app.

## Implementation note
The app source patch uses the portrait splash in `public/`, updates PWA icon assets/theme colors, adds the first-launch splash component, and includes a script step for Android launcher resources in GitHub Actions. Confirm a successful GitHub Actions APK build before installing it.
