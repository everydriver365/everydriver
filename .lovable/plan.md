## Goal

Replace the current navy "Next lesson" tile in the pupil mobile dashboard (`Drive365PupilHome.tsx`) with the same layout/design as the instructor app's `UpNextCard` — but with the data direction flipped (showing the **instructor** to the pupil, not the pupil to the instructor).

Scope: mobile pupil portal `/p/:slug` only. No changes to the actual `UpNextCard` component (used by instructors) or to DSM.

## Layout to replicate

Card structure (white card, 20px radius, soft blue shadow, SF/Inter stack):

1. **Map strip (110px)** — `StaticMapPreview` of pickup postcode
   - Top-left chip: `LIVE · {countdown}` (e.g. "In 2 days", "In 3 hours", "In 25 min")
   - Top-right chip: `Navigation` icon + ETA from `useTrafficETA(pickupPostcode)` — tappable, opens Apple/Google Maps directions
2. **Info area**
   - Time hero: large 28px tabular `HH:mm`
   - Line 2 (bold): instructor full name
   - Line 3 (muted): `Standard lesson · {duration}h · {pickupPostcode or pickupLocation}`
   - Right side: instructor avatar (44px) — tappable to open instructor profile/contact sheet (or no-op if none exists yet)
3. **Action row** — three buttons
   - Primary red **Call** (instructor phone) — `tel:` link
   - Secondary blue **Text** (instructor phone) — `sms:` link
   - Secondary blue **Go** — open maps to pickup
4. **Expand handle** at bottom (`Details`) — for v1, hide this. The instructor version's expanded panel delegates to `NextUpTile` which is instructor-only logic; pupils don't need it.

## Data mapping (pupil side)

The pupil dashboard already queries `nextLesson` with: `lesson_date`, `start_time`, `duration_minutes`, `pickup_location`. We need to ensure these extra fields are available:

- `pickup_postcode` — needed for `StaticMapPreview` + `useTrafficETA`. Add to the `nextLesson` Supabase select if not already present.
- Instructor data — already available via the `instructor` prop on `Drive365PupilHome` (`id`, `name`, `phone`). Add `profile_image_url` to the instructor fetch in `BrandedPupilPortal.tsx` and pass it through.

Countdown: compute `minutesUntil` from `lesson_date + start_time` vs `now` (Europe/London).

## Files to change

- `src/components/pupil-portal/Drive365PupilHome.tsx` — replace the existing navy "Next lesson" block (lines ~202–290) with the new card. Reuse `StaticMapPreview` from `@/components/UpNextCard/StaticMapPreview` and `useTrafficETA` from `@/hooks/useTrafficETA`. Extend the `nextLesson` query to select `pickup_postcode`.
- `src/components/pupil-portal/Drive365PupilHome.tsx` Props — extend `instructor` prop to include optional `profile_image_url`.
- `src/pages/BrandedPupilPortal.tsx` — pass `instructor.profile_image_url` into `Drive365PupilHome`.

No new components are extracted; the markup lives inline in `Drive365PupilHome.tsx` like the surrounding editorial sections.

## What's intentionally different from instructor version

- Avatar shows the **instructor** to the pupil (not the pupil to themself).
- Call/Text target the **instructor's phone**.
- "Up next" small-caps label above the card is dropped — the pupil card sits inside the existing editorial layout which already has its own rhythm.
- The expand-for-details footer is removed (no `NextUpTile` equivalent for pupils).
- Empty state (no upcoming lesson) keeps current copy: "No upcoming lesson — Book your next session →".

## Open question

Tap on the instructor avatar — should it (a) do nothing, (b) open a phone/text sheet, or (c) link to an instructor profile page? I'll default to **(a) no-op** unless you say otherwise.
