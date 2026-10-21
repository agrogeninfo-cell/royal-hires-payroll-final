# Royal Hires Official Website — Motion & Transition Specification

## Brand lock
- Brand: Royal Hires
- Slogan: The Royal Standard Of Recruitment
- Palette: near-black `#07050D`, deep purple `#160D2B`, electric violet `#7C3AED`, soft white `#F7F5FF`, muted grey `#AAA4BA`.
- Do not use gold, champagne, bronze, or gold-like accents.
- This is the public corporate website only. Do not display or query payroll records, employee salaries, attendance, customer invoices, Royal Pay tables, or other private company operations data.

## Motion principles
Motion should feel refined and purposeful. Keep content accessible and fast; honor `prefers-reduced-motion: reduce`.

### Route / page transitions
- Default: 320ms, ease-out.
- Enter: opacity 0 → 1; translateY 12px → 0.
- Exit: opacity 1 → 0 with translateY 0 → -4px, 160ms.
- Avoid waiting for exit completion if it delays navigation or focus.
- Maintain scroll restoration policy per route; update focus to main heading on route change.

### Hero entrance
- Eyebrow: 260ms, fade + translateY(10px).
- Headline: 420ms, fade + translateY(18px), 60ms delay after eyebrow.
- Body: 360ms, fade + translateY(12px), 100ms delay.
- CTA group: 320ms, fade + translateY(8px), 100ms delay.
- One-time on initial view; no content remains hidden if JavaScript/animations do not run.

### Scroll-reveal sections
- 450ms, cubic-bezier(0.16, 1, 0.3, 1), translateY(22px) → 0.
- Trigger once around 15% in viewport.
- Cards stagger at 60–80ms; avoid large stagger chains.
- Use IntersectionObserver; disable transform and reveal immediately under reduced motion.

### Micro-interactions
- Buttons: 180ms, translateY(-2px), violet shadow/glow.
- Links: 200ms sliding underline with visible keyboard focus state.
- Service cards: 220ms translateY(-3px), border-color to violet; avoid 3D flips.
- Icons: optional 180ms opacity/scale; no perpetual rotation or bounce.

### Navigation
- Desktop active underline: 220ms scaleX.
- Mobile drawer: 240ms translateX(100%) → 0; overlay fade 180ms.
- Respect focus trap, Escape close, reduced motion, and accessible aria-expanded/aria-controls.

### Accessibility and performance
- `@media (prefers-reduced-motion: reduce)`: disable or sharply reduce animations/transitions and all looping/ambient motion.
- Keep text contrast high; never encode state with color alone.
- Animate opacity/transform rather than layout dimensions.
- No auto-playing audio or motion that blocks interaction.
- Provide static visual fallbacks; avoid layout shifts.
- All elements visible and usable when CSS animation is disabled.

## Acceptance checks
- Page transitions work on Home, About, Services, Employers, Careers, Contact.
- Direct-link refresh and browser Back/Forward work.
- Touch devices have clear active states; no hover-only functionality.
- Reduced-motion mode renders immediately without directional movement or repeated ambient effects.
- No payroll dashboard route/data/API is linked from the public site.
- Build, lint, route smoke tests and mobile viewport tests pass before publishing.
