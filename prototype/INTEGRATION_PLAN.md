# Royal Pay Dashboard — Integration Plan (Draft)

## Repository facts checked
- App entry/layout is `src/App.tsx`; it uses an existing `MainLayout`, `AppProvider`, `AuthGate`, and tab navigation.
- Existing tabs include dashboard, attendance, overtime, factories, employees, boarding, payroll, invoices, receipts, reports, audit, and profile.
- Package scripts include `npm run build`, `npm run lint`, and `npm run test:unit`.
- The existing app has an IndexedDB data service and an existing Supabase cloud-sync service. This prototype must not introduce a second competing data store or bypass existing access checks.
- Existing sync currently applies explicit restrictions to its collection and factory scope. Dashboard integration must respect those rules, not widen them.

## Recommended integration sequence

### Phase A — Visual review only
1. Review the standalone prototype on a phone-sized viewport and desktop.
2. Confirm English/Sinhala language direction and Royal Hires branding.
3. Confirm the dashboard should be a replacement for the existing dashboard or a separately selectable preview. Default recommendation: a separate preview route/tab until approved.

### Phase B — Read-only React component
1. Implement the approved UI as a React component under `src/components/` or an isolated dashboard folder.
2. Use existing design conventions and installed `lucide-react` icons; avoid adding dependencies unless necessary.
3. Reuse the existing authenticated application context and data services.
4. Keep a feature flag or explicit preview tab so the existing dashboard remains the default.
5. Start with synthetic fixture data only; do not connect live records during UI implementation.

### Phase C — Authorized read model
1. Add a narrowly scoped read-only selector/service that returns the documented DashboardSummary and FactorySummary.
2. Reuse existing record types and saved PayrollRun/PayrollItem/FactoryInvoice snapshots.
3. Do not copy wage formulas into UI code or recompute historical payroll/invoices from current rates.
4. Apply role/factory access checks before aggregation. Supervisors must only see assigned factories and collections permitted by existing policy.
5. Use clear loading, empty, offline/stale, permission-denied, and error states. Missing data must not be displayed as a fabricated zero.

### Phase D — Verification
Run from a clean checkout on the feature branch:
- `npm ci` (if lockfile and environment permit)
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- Android/Capacitor sync and build only after web checks pass.
Record actual command results; do not report a test as passed unless it was run and succeeded.

Regression checks:
- Payroll calculation and historical snapshots unchanged.
- Invoice generation and receipt allocation unchanged.
- Payslip/PDF and Excel exports unchanged.
- IndexedDB persistence, offline queue, and cloud sync unchanged.
- Supervisor access restrictions unchanged.

### Phase E — Review and release
1. Update the existing dashboard PR with UI, service, and tests only after the user approves the visual direction.
2. Keep PR in draft until review checklist is complete.
3. Do not merge, deploy publicly, enable live dashboard data, change sync provider, or migrate data without explicit user approval.
4. Keep a rollback path: disable feature flag/preview route and restore the existing dashboard without database rollback.

## Out of scope without separate approval
- Google Sheets integration or cutover.
- Database schema changes or migrations.
- Changes to payroll, OT, invoice, payment, or receipt logic.
- Any production-data write or destructive operation.
- Public hosting of a dashboard that contains real employee or financial data.
