# Royal Hires public website deployment

## Important separation rule

This repository also contains the private Royal Pay payroll application source. Do **not** enable GitHub Pages for this repository as the public company website: repository-level Pages deployment could expose or publish the wrong application, and must not be used as a shortcut.

Publish only the static contents of this `website/` directory to a **separate website repository** or a separate static hosting project. The public company website must not include payroll records, employee information, authentication data, Supabase keys, or internal dashboard routes.

## Recommended route: separate GitHub repository

1. Create a new public repository named `royal-hires-website` under the company GitHub account.
2. Copy only the files inside this `website/` directory into that repository's root. Do not copy payroll app files, database exports, environment files, or secrets.
3. In the new repository, open **Settings → Pages** and choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. Wait for GitHub Pages to publish, then open the URL shown in **Settings → Pages** on both desktop and mobile.
5. Check all contact links and company information before sharing the URL publicly.

## Pre-publication checklist

- [ ] Company phone, email, address and service details verified.
- [ ] No fictional customer testimonials, unsupported statistics, or unapproved claims.
- [ ] Mobile navigation, section links, animations and reduced-motion behavior checked.
- [ ] Contact form behavior verified (a static form does not send messages without a configured service).
- [ ] No employee data, payroll data, private credentials, or Supabase secrets included.
- [ ] Public URL checked on Android Chrome and desktop.

This guide intentionally does not enable Pages or publish anything from the payroll repository. Keep PR #34 unmerged until the site is reviewed and the separate repository is ready.
