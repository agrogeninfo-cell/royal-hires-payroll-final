# Royal Pay — Web-First Delivery Plan

## Goal
Deliver Royal Pay as a browser-based web application first. Do not make an Android APK the delivery target for this phase. Revisit Android only after the web application is deployed and verified.

## Guardrails
- Work only on `feature/royal-pay-premium-dashboard` until reviewed.
- Do not merge into `main` without explicit user approval.
- Do not change production data, payroll/invoice calculations, database schema, historical snapshots, authentication rules, or existing sync behavior as part of web presentation work.
- Never expose Supabase service-role keys or other secrets in browser code.
- Keep employee and financial data behind authentication and existing role/factory permissions.

## Delivery phases
1. **Web baseline:** Build the existing React/Vite application for standard browsers. Keep the existing application modules and data services.
2. **Responsive UI:** Verify phone, tablet, and desktop layouts; allow browser zoom; fix horizontal overflow and inaccessible controls.
3. **Export regression:** Test invoice print/PDF, payslip print/PDF, CSV/Excel downloads on desktop Chrome and Android Chrome. Do not mark exports fixed based on compilation alone.
4. **Security and persistence:** Verify admin/office/supervisor access, refresh behavior, offline/local persistence, and current cloud sync boundaries.
5. **Hosting:** Select and configure hosting only after confirming the target domain/host and its access-control approach. Never publish production data or an unprotected payroll UI.
6. **Release review:** Run lint, unit checks, and production web build; inspect actual hosted behavior before calling the release complete.

## Current work
- `index.html` viewport metadata now permits browser zoom (removed `maximum-scale=1.0` and `user-scalable=no`).
- The dashboard preview and invoice print changes remain on this feature branch.
- Web hosting is not configured by this document.
- A successful build does not prove print/PDF works on a real device; device verification is required.
