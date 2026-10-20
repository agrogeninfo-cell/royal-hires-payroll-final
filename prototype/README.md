# Royal Pay Premium Dashboard Prototype

## Preview file
Open `royal-pay-premium-dashboard.html` in a browser. It is a self-contained, responsive HTML/CSS/JavaScript mockup with no external dependencies.

## Safety scope
- This prototype is isolated under `prototype/`; it is not imported into the production React app.
- It does not connect to Google Sheets, Supabase, IndexedDB, or any production service.
- It contains no real employee, payroll, invoice, receipt, or personal data.
- KPI cards and charts use placeholders instead of invented values.
- It does not change existing payroll formulas, database schema, production records, or app behavior.
- The navigation is a visual prototype, not a functional link to production modules.

## Next steps before any live integration
1. Review and approve the visual direction.
2. Inspect the current app data types and calculation services.
3. Define a read-only dashboard data contract and test fixtures using synthetic data.
4. Implement behind a separate feature flag/route and verify existing tests.
5. Design authenticated server-side Google Sheets access; do not expose service credentials in browser code.
6. Test concurrency, authorization, data reconciliation, exports, and rollback before any cutover.

No live integration or production cutover is included in this change.
