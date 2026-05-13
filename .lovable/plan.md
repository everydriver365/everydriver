## Issue

Clicking **Course details** on `/drive365/search` navigates to `/book/:instructorId` (BookingSummary). That path is not in the Drive365 route prefixes list in `src/hooks/useRouteLogo.ts`, so the header falls back to the DSM (Driving School Manager) logo and home link — making a learner-facing page appear DSM-branded.

## Fix

Add learner-facing booking paths to `DRIVE365_ROUTE_PREFIXES` in `src/hooks/useRouteLogo.ts`:

- `/book` — covers `/book/:instructorId`
- `/booking-confirmation`
- `/booking/` — covers `/booking/:slug` public booking portal
- `/search` — covers the bare `/search` alias

These are all pupil/learner journeys and should render Drive365 branding (or whitelabel branding when on a branded host, which already works via `getWhitelabelConfig()`).

## Out of scope

- No changes to BookingSummary content or business logic.
- No DB or routing changes.
- DSM-branded admin/instructor routes remain untouched.