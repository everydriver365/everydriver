

# Fix Login Links on Drive365 Website

## Problem
The "Instructor Login" and "Admin Login" links on drive365.co.uk navigate to external URLs (everydriver.co.uk) instead of staying on the current domain. This happens because:

1. **SecondaryNav.tsx** — Instructor Login is hardcoded as an external link to `https://everydriver.co.uk/instructor/login`
2. **Header.tsx** (mobile menu) — Same external link to `https://everydriver.co.uk/instructor`
3. **Footer.tsx** — Instructor Portal links externally to `https://everydriver.co.uk/instructor-app`

## Fix
Convert all login links to use internal React Router `<Link>` components pointing to the correct internal routes:

| Component | Current | Changed To |
|-----------|---------|------------|
| SecondaryNav.tsx | `<a href="https://everydriver.co.uk/instructor/login">` | `<Link to="/instructor-app/login">` |
| Header.tsx mobile | `<a href="https://everydriver.co.uk/instructor">` | `<Link to="/instructor-app/login">` |
| Footer.tsx | `<a href="https://everydriver.co.uk/instructor-app">` | `<Link to="/instructor-app/login">` |

Additionally, update `DomainRouter.tsx` to add `/instructor-app/login` to the `LEARNER_ALLOWED_ROUTES` whitelist so it isn't redirected away from drive365.co.uk. Also add `/admin/login` explicitly if not already covered (it's covered by `/admin` in SHARED_ROUTES).

## Files Changed
- `src/components/layout/SecondaryNav.tsx` — change external link to internal Link
- `src/components/layout/Header.tsx` — change external link to internal Link  
- `src/components/layout/Footer.tsx` — change external link to internal Link
- `src/components/DomainRouter.tsx` — add `/instructor-app/login` to allowed routes

