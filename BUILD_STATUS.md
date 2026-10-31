# Royal Hires Payroll — Release Status

Last updated: 2026-10-31

## Release candidate

- Repository: `agrogeninfo-cell/royal-hires-payroll-final`
- Release branch: `release/royal-hires-appmint-final` (merged)
- Pull request: https://github.com/agrogeninfo-cell/royal-hires-payroll-final/pull/43 (**merged**)
- Main release commit: `5a4e63ad23e3a0728e16ef55c9416196e30375d2`
- Production Supabase project: `jwghmsflabvzzhucuwsn`
- Corporate website deployment is a separate next phase. The payroll app is not automatically published to a public website.

## Modules retained

Employee management, attendance, shift selection including D+N, overtime entry/approval, payroll, meal tracking and meal bills, boarding, advances, settlements, salary slips, factory billing/invoices, receipts, reports, backups and audit records remain in the app.

## Confirmed business rules

### Empire Teas

- Worker wages: LKR 2,000 weekday/Saturday; LKR 2,300 Sunday/Poya.
- D+N is paid and billed as two shifts, but counts as one calendar date for the factory invoice attendance bonus.
- Factory invoice attendance bonus: LKR 5,500 after 21 attendance days. This is invoice-only and is not included in worker gross pay or salary slips.
- Female night allowance: LKR 100 per night shift, invoice-only. It is not included in worker salary.
- Factory invoice OT: 3 mandatory hours per weekday/Saturday shift at LKR 225/hour; 12 mandatory hours per Sunday/Poya shift at LKR 300/hour.
- Employee OT pay rate has not been confirmed. The payroll calculation blocks settlement if approved employee OT exists while the employee OT pay rate is unset; this prevents paying approved OT at zero.

### Millennium Teas

- Worker wages: male LKR 2,500; female LKR 2,100.
- Employee OT pay: LKR 180/hour; factory OT billing: LKR 225/hour.
- Late deduction default: LKR 150/hour.
- Meal rates loaded: breakfast LKR 130, lunch LKR 250, dinner LKR 250.

## Production database and security

- Added production app tables, company/profile/factory mappings, app-record storage, worker portal credentials and sessions, and RLS policies.
- Existing legacy tables and employee/payroll records were not deleted.
- Current production data check: 1 mapped admin profile, 2 factory records, 2 factory configuration app-records, 0 worker PIN accounts and 0 legacy employee rows.
- Worker PIN hashes and worker sessions are handled by server-side Edge Functions; the worker portal function and admin access function are deployed.
- Factory configurations are stored in the shared Supabase project for the app and future Royal Workforce portal.
- Production employee and worker PIN login still require a controlled end-to-end smoke test after the app package is installed.

## Build and packaging

- **PASS — GitHub Actions Build Android APK run #356** (commit `a26ae79edc92a3ea5af5995b3bfdc389274a8792`): dependency installation, production Supabase configuration check, TypeScript validation, payroll/billing/invoicing unit tests, Vite build, AppMint ZIP packaging, Capacitor sync, Android branding and debug APK build all succeeded.
- **PASS — Worker Portal Validation run #71**: TypeScript validation, payroll/billing tests and worker portal production build succeeded.
- AppMint artifact: `royal-hires-appmint-web`, artifact ID `13047215788`; the downloaded inner ZIP was integrity-checked and contains `index.html` at the archive root. SHA-256: `4fb21eb4dc66b3613ea58ab2e26127504db6943fb4b83b7d1a8da0af7fbcacc2`.
- Debug APK artifact: `royal-hires-payroll-production-debug-apk`, artifact ID `13047106294`.
- GitHub Pages deployment is manual-only. A normal source push or PR merge does not publish the payroll app.

## Release checks still required

1. Import the verified AppMint ZIP into AppMint and generate the Android APK.
2. Install the APK and sign in with the production admin account.
3. Verify cloud sync, employee creation, attendance, D+N, payroll, meal/boarding deductions, invoice OT and invoice-only attendance bonus using controlled test records.
4. Verify worker PIN login, salary visibility and salary-slip download after a test employee is created.
5. After the payroll app is accepted, complete the separate corporate website and Royal Workforce landing-page integration.

No live employee records have been added for testing. The release is now on `main`; no public website deployment was triggered by the merge.
