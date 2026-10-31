# Royal Hires Payroll — AppMint package

The CI workflow creates `royal-hires-appmint-web.zip` from the production Vite build. The archive contains the static web application with `index.html` at its root and the compiled assets alongside it.

## AppMint import

1. Download the `royal-hires-appmint-web` artifact from the successful GitHub Actions run.
2. Extract the ZIP only if AppMint asks for a folder; otherwise upload the ZIP as supplied.
3. Set `index.html` as the start page.
4. Use the app name **Royal Hires Payroll** and enable internet access.
5. Do not add Supabase service-role or secret keys to AppMint. The built app uses only the public publishable key and relies on Supabase Auth and row-level security.

## Data and release notes

- The Android wrapper and the AppMint web wrapper use the same production Supabase project.
- Local records are stored in IndexedDB and synchronized to the shared cloud database after sign-in.
- Cloud synchronization does not automatically upload unapproved legacy local records and does not delete remote records.
- The corporate website remains a separate deployment. It will link to the Royal Workforce landing page in the next project phase.
- GitHub Pages deployment is manual-only. A normal source push does not publish the payroll app.
