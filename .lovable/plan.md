## Problem

Clicking "How pupils book" in the Critical sidebar goes to `/instructor/settings/how-pupils-book` and renders a "complete mess" — actually the Profile panel.

Why: there are two settings pages in the codebase:

- `src/pages/instructor/SettingsPage.tsx` — old V2 shell. Its `ALL_SETTING_IDS` only knows ids like `profile, hours, how-book, vehicle, rates, payment-methods…`.
- `src/pages/instructor/InstructorSettingsHub.tsx` — new V3 shell (`SettingsShellV3`). Its `AREA_GROUPS` use ids like `how-pupils-book, working-hours, credentials, rates-coverage, payments, discounts-packages, mini-site, branding, plan-billing, phone-ai, data-privacy…` and it also has a `LEGACY_ID_MAP` to translate the old ids.

The route `/instructor/settings/:categoryId` in `src/routes/instructorPortalRoutes.tsx` currently lazy-loads `SettingsPage` (the V2 shell). So when the sidebar (and the seeded Critical defaults) link to V3 slugs like `how-pupils-book`, V2 doesn't recognise them, silently falls back to `"profile"`, and the user sees Profile rendered under a "How pupils book" link.

This is not just "How pupils book" — the same fallback silently breaks: `working-hours`, `rates-coverage`, `credentials`, `discounts-packages`, `payments`, `phone-ai`, `mini-site`, `branding`, `plan-billing`, `data-privacy`, `appearance-layout`, `help-close`, `lab-features`, `login-security`, `messaging`. All of these currently land on Profile.

## Fix

Point the settings routes at the V3 hub, which is the page the sidebar was already written for and which already handles legacy ids.

### Changes

1. `src/routes/instructorPortalRoutes.tsx`
   - Change the lazy import from `@/pages/instructor/SettingsPage` to `@/pages/instructor/InstructorSettingsHub` (keep the same `InstructorSettingsHub` variable name).
   - Leave the two route entries (`/instructor/settings` and `/instructor/settings/:categoryId`) as-is.

2. No other code changes. `SettingsShellV3` already:
   - Reads `:categoryId` and resolves it via `ALL_ITEM_IDS` or `LEGACY_ID_MAP`.
   - Renders the matching area item ("How pupils book" → bookings/courses, booking-mode, deposits, intake).
   - Falls back gracefully if the slug is unknown.

3. Mobile is unchanged — `InstructorSettingsHub` already renders the existing `SettingsLayout` drill-down on mobile, matching the project rule of not altering mobile layouts.

### Out of scope

- Not renaming any sidebar links.
- Not editing `SettingsPage.tsx` (left in place; can be removed in a later cleanup once we confirm nothing else imports it).
- No DB/migration changes; the seeded Critical defaults already use the V3 slugs.

### Verification

After the change:
- `/instructor/settings/how-pupils-book` shows the "How pupils book" hero + Courses / Booking mode / Deposits / Intake sections.
- `/instructor/settings/working-hours`, `/rates-coverage`, `/credentials`, `/payments`, `/discounts-packages`, `/mini-site`, `/branding`, `/plan-billing`, `/data-privacy` all resolve to their correct V3 area items instead of falling back to Profile.
- `/instructor/settings/hours` (legacy) still resolves via `LEGACY_ID_MAP` if anything still links to it.
