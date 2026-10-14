# Royal Pay — Build and Audit Status

Last updated: 2026-10-14

## Current working state

- Repository: `agrogeninfo-cell/royal-hires-payroll-final`
- Working branch: `fix/invoice-csv-export`
- Production branch: `main` (not edited directly)
- Pull request: https://github.com/agrogeninfo-cell/royal-hires-payroll-final/pull/1
- Current branch head at last check: `0cf3a740ce6b613e603c416738148687cc7df736`
- The pull request remains open and unmerged.

## Implemented on the working branch

- Invoice CSV cells are escaped consistently, CSV uses CRLF and UTF-8 BOM, and native Android export writes to app cache and opens the system share sheet.
- Header and splash components now reference the current wordmark/emblem under `brand-kit-export/company-logo/`.
- Android launcher script now copies pre-rendered icon resources from `brand-kit-export/android-assets/` and preserves unrelated existing Android color definitions.
- Native startup configures the status bar not to overlay the WebView, sets the brand background and light status-bar content; PWA service-worker registration remains browser-only.
- Responsive CSS includes dynamic viewport sizing and safe-area padding.
- Payroll formulas, employee records, attendance, invoices, factory rates, database schema and historical data were not intentionally changed.

## Verified build results

- **PASS — GitHub Actions run #46**, commit `1dc18620763b0203da347c539352b0b409c8a6a4`: dependency install, TypeScript validation, payroll/billing/invoicing unit checks, Vite production build, Capacitor sync, previous launcher-generation step, Gradle debug APK build and artifact upload succeeded.
- **PASS — artifact integrity** for run #46: downloaded ZIP passed `unzip -t`; contained `app-debug.apk` (7,316,050 bytes), SHA-256 `248dac2c57868ba15591c049e58a108a67046a02cbce21ccb64b102eba67f378`.
- **IMPORTANT:** that APK predates the latest brand asset and status-bar commits. Do not install it as verification of those changes.
- **IN PROGRESS at last check — GitHub Actions run #48** builds the earlier brand-script change. A fresh run for the latest branch head must be checked before distributing a current APK.

## Audit findings / release blockers

1. **Authentication:** the React app uses client-side role state and a demo role switcher. No verified server-side identity/authorization service was found in inspected application source. Do not treat UI role checks as a security boundary.
2. **Synchronization:** `src/services/syncService.ts` processes the local IndexedDB queue only; no remote API call was found. This is not cloud or multi-device synchronization.
3. **Persistence:** IndexedDB and LocalStorage mirror are local-device persistence, not a guaranteed backup. Keep regular exports and test restores.
4. **Dependency reproducibility:** no npm lockfile was found at repository root; the workflow uses `npm install`, not `npm ci`.
5. **Full-screen behavior:** status-bar overlay handling is now configured in source, but the exact target Android device must still be tested for header clipping, system bars, back navigation, and bottom inset behavior.
6. **Exports:** the invoice export inspected here is CSV, not a genuine XLSX workbook. PDF/letterhead and report reconciliation need their own targeted verification.
7. **Payroll integrity:** existing rules include current six-day weekly and 26-day monthly divisors; do not change without approved business requirements and reconciliation tests.

## Still required before release

- Fresh GitHub Actions PASS for the current head, including status-bar plugin installation and launcher resources.
- Install the new artifact on the target Android device; verify icon, header logo, splash, status/navigation bars, back behavior, and CSV share/save flow.
- Run backup/restore drills with non-production data.
- Resolve production authentication and remote-sync architecture before relying on multi-user or multi-device security/synchronization.
- Review the pull request; do not merge, deploy, or publish a release without explicit authorization.
