# Royal Hires Payroll — Release Status

Last updated: 2026-10-31

## Release candidate

- Repository: `agrogeninfo-cell/royal-hires-payroll-final`
- Release branch: `release/royal-hires-appmint-final`
- Pull request: https://github.com/agrogeninfo-cell/royal-hires-payroll-final/pull/43
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

- GitHub Actions run #356: dependency installation, Supabase configuration check, TypeScript validation, payroll/billing/invoicing unit tests and Vite production build passed.
- AppMint ZIP packaging step is running; Android project and APK build are pending in the same workflow.
- The build workflow uploads `royal-hires-appmint-web.zip` as the `royal-hires-appmint-web` artifact.
- GitHub Pages deployment is manual-only. A normal source push does not publish the payroll app.

## Release checks still required

1. Complete the current GitHub Actions run and confirm AppMint ZIP and APK artifacts are uploaded.
2. Complete the worker portal validation workflow.
3. Install the AppMint ZIP in AppMint and sign in with the production admin account.
4. Verify cloud sync, employee creation, attendance, D+N, payroll, meal/boarding deductions, invoice OT and invoice-only attendance bonus using controlled test records.
5. Verify worker PIN login, salary visibility and salary-slip download after a test employee is created.
6. After the payroll app is accepted, complete the separate corporate website and Royal Workforce landing-page integration.

No live employee records have been added for testing, and no public website deployment has been triggered by this release branch.
