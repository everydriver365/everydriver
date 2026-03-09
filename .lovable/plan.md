

## Problem

On drive365.co.uk, several links used in Drive365 pages point to routes that are **not whitelisted** in `DomainRouter.tsx`, causing them to redirect to everydriver.co.uk:

1. **`/drive365`** -- Used as "Home" link in Header, MobileHomepage, MobileBottomNav, Benefits, Footer. This route is NOT in `LEARNER_ALLOWED_ROUTES` or `SHARED_ROUTES`, so DomainRouter redirects it to everydriver.co.uk.
2. **`/learner-app/signup`** -- Used in MobileHomepage menu. Not whitelisted.
3. **`/instructor-app/login`** and **`/instructor/login`** -- Used in MobileHomepage, Header, SecondaryNav. These are instructor routes that intentionally redirect, but should use absolute `<a>` tags to everydriver.co.uk instead of SPA `<Link>` navigation (avoids a flash/double redirect).

## Plan

### 1. Add missing Drive365 routes to the DomainRouter whitelist

In `src/components/DomainRouter.tsx`, add these to `LEARNER_ALLOWED_ROUTES`:
- `/drive365`
- `/learner-app/`
- `/benefits`

### 2. Convert instructor login links to absolute URLs on Drive365 pages

In these files, change instructor login `<Link to="...">` to `<a href="https://everydriver.co.uk/...">` so they navigate directly without a SPA redirect loop:

- **`src/components/layout/Header.tsx`** -- line 167: `/instructor` link
- **`src/components/layout/SecondaryNav.tsx`** -- line 8: `/instructor/login` link
- **`src/components/MobileHomepage.tsx`** -- line 524: `/instructor-app/login` link

### 3. Verify Footer links

In `src/components/layout/Footer.tsx`, the `/instructor-app` link should also use an absolute URL to everydriver.co.uk.

