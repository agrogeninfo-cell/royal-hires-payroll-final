# Royal Hires Payroll

Royal Hires Payroll is a React + TypeScript + Vite web app packaged for Android with Capacitor. It supports factory attendance, overtime approvals, payroll, invoices, receipts, boarding locations, reports, and company-scoped cloud synchronization through Supabase.

## Run locally (localhost)

Requirements: Node.js 22 or newer and npm.

1. Clone the repository and switch to the release/fix branch:
   ```bash
   git clone https://github.com/agrogeninfo-cell/royal-hires-payroll-final.git
   cd royal-hires-payroll-final
   git fetch origin
   git switch fix/export-and-boarding-actions
   git pull --ff-only origin fix/export-and-boarding-actions
   ```
2. Install dependencies and start the Vite development server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in the same computer's browser.

Vite is configured to listen on `0.0.0.0:3000`. To open it from a phone on the same trusted Wi-Fi network, use the computer's LAN IP with port `3000` (for example, `http://192.168.1.10:3000`). The phone and computer must be on the same network, and the computer firewall must allow that port. Do not expose this development server directly to the public internet.

## Cloud login and two-user sync

- The app uses Supabase authentication and company-scoped cloud records. Both users must sign in to the same approved company workspace for shared records to sync.
- Access is governed by the user's approved account role, factory assignments, and Supabase Row Level Security; supervisors should only receive records within their authorized factory assignments.
- The development build uses the project's configured Supabase client unless `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are supplied in a local `.env` file.
- Only a Supabase **publishable** client key may be used in browser/mobile builds. Never add a service-role key, passwords, or private credentials to `.env.example`, source control, or client-side code.
- Browser IndexedDB is device/browser-local storage. It is not shared by itself. Shared data reaches the other signed-in user through the Supabase cloud sync and realtime refresh. A localhost session and an Android app session use separate local stores, even when they use the same cloud workspace.
- New or explicitly saved records are eligible for cloud sync. Legacy local-only records are intentionally not automatically bulk-uploaded. No cloud-wide data wipe is performed by switching branches or rebuilding the app.

## Validation

Run the same checks used by CI before releasing:
```bash
npm run lint
npm run test:unit
npm run build
```

Android debug APKs are built by the GitHub Actions workflow at `.github/workflows/build-android-apk.yml`. The APK artifact is a debug build, not a signed production release.

## Safe release workflow

- Work on a feature branch and review the pull request before merging to `main`.
- Do not erase shared cloud data as part of a local reset or update.
- Before calling a release complete, verify the CI build and test results. Physical Android checks are still needed for native PDF/CSV save-share behavior and boarding add/edit/archive flows.
