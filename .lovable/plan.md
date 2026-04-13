

## Plan: Replace EveryDriver logo with DSM logo on non-Drive365 pages

### What changes
The `useRouteLogo` hook currently returns the EveryDriver logo for all non-Drive365 routes. We'll change it to return the DSM logo instead.

### Single file change

**`src/hooks/useRouteLogo.ts`**
- Replace `const EVERYDRIVER_LOGO = "/everydriver-logo-v2.png"` with an import of the existing `src/assets/dsm-logo.png`
- Update the return values: change `"EveryDriver"` alt text to `"DSM"` for non-Drive365 routes
- The logo variable for non-Drive365 routes will point to the DSM asset

This automatically propagates to the Header, Footer, Benefits page, NotFound page, and MobileHomepage since they all consume `useRouteLogo()`.

No other files need changes — the booking pages (`SchoolBookingPage.tsx` and `PublicBookingPortal.tsx`) already use the DSM logo directly.

