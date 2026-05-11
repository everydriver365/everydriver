# Show "Unavailable" on Winchester site when Kenneth's visibility is off

## Current behaviour

The Winchester whitelabel `/courses` page resolves Kenneth's instructor via the `public_instructors` view, which is defined as `WHERE is_active = true`. Kenneth's visibility toggle in **Instructor → Mini-website → Visibility** writes to `instructors.is_active`.

Result: when he toggles visibility OFF, his row drops out of the view entirely, so the page falls into the generic `"Instructor not found."` error instead of a friendly "currently unavailable" state. The branded home page (`/`) also keeps rendering normally with no "we're closed" indication.

## Goal

When Kenneth toggles his profile visibility off:
- The Winchester `/courses` page shows a clear "Currently not accepting bookings" empty state (branded, no error wording).
- The Winchester home (`/`) shows a small, branded "Bookings paused" notice in place of the courses CTA.
- Direct booking link `/book/<id>` shows the same friendly unavailable state instead of letting someone book.

## Changes (frontend only — no schema changes)

1. **`src/pages/WhitelabelCourses.tsx`**
   - Replace the `public_instructors` lookup with a query against the new `instructor_public_status` RPC (see below) OR query `instructors` directly via a small read-only RPC so we can read `is_active` even when false.
   - Distinguish three states: `not_found`, `hidden` (active=false), `available`.
   - For `hidden`, render a branded card: heading "Bookings paused", subtext "Kenneth is not currently accepting new bookings. Please check back soon." with a "Notify me" mailto link to the school's contact email.

2. **New tiny edge-safe RPC `get_whitelabel_instructor_status(slug text)`** (migration)
   - Returns `id, is_active, available_from, name, email`.
   - `SECURITY DEFINER`, locked-down `search_path`, returns only those columns — no PII beyond what the public view already exposes.
   - Reason: keeps the public view's `is_active = true` invariant intact for the rest of the app.

3. **`src/pages/WhitelabelHome.tsx` (or whichever component renders the branded `/`)**
   - Read the same status. When `hidden`, replace the "Browse courses / Book now" CTA with a muted "Bookings paused" pill and disable the courses link.

4. **`src/pages/Book.tsx` (or the booking entry component used by `/book/:id`)**
   - When the requested instructor is whitelabel-scoped AND `is_active = false`, show the same "Bookings paused" screen instead of the booking flow.
   - Non-whitelabel routes are unaffected (their existing handling stays).

5. **Copy & branding**
   - Use the whitelabel `brandName` and `brandColour` for the unavailable card.
   - No new translations needed beyond the two new strings.

## Out of scope

- No change to the `is_active` toggle UI itself.
- No change to admin/school portal behaviour.
- No "vacation mode" or scheduled return date — just on/off, mirroring the existing toggle.

## Verification

- In Instructor → Mini-website → Visibility, toggle Kenneth's visibility off.
- Visit `winchesterdrivingschool.co.uk` → home shows "Bookings paused".
- Visit `/courses` → branded "Bookings paused" card, no instructor list.
- Visit `/book/<kenneth-id>` → same friendly screen, booking form not rendered.
- Toggle back on → all three pages return to normal within a refresh.
