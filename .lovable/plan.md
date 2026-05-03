## Goal

Bring back the rich, full-featured behaviour of the existing `NextUpTile` (travel-time/ETA, route recorder, end-lesson wizard, running-late, smart prompts, vehicle health, payment status, expand/collapse, etc.) inside the new brand-styled "Up next" card on the redesigned mobile home — without losing the new map-hero / blue-rail / Call-Message-Navigate design.

## Approach

Treat the redesigned `UpNextTile` as the **summary header** and mount the existing `NextUpTile` (`src/components/instructor/NextUpTile.tsx`) as the **expanded body** when the user taps to expand. Both share the same data from `useNextLessonDetails`, so no new fetching is needed.

```text
[ MAP HERO + frosted pill + start time ]
[ Blue rail | Duration / Pickup / Call · Msg · Nav ]   <-- new design (always shown)
                  ▼ chevron
[ NextUpTile expanded section ]                        <-- existing rich features
  - Travel time + traffic ETA
  - Smart prompts strip
  - Lesson route recorder / Start tracking
  - Check-in badge
  - Pupil unread, balance, prepaid hours
  - Reschedule / Cancel / End lesson wizard
  - Running-late sheet, driving alerts, vehicle health
```

## Changes

### 1. `src/components/instructor/MobileHomeRedesign.tsx`
- Add `const [expanded, setExpanded] = useState(false);` in `MobileHomeRedesign`.
- Pass `expanded` + `onToggleExpanded` props to the redesigned `UpNextTile`.
- In `UpNextTile`:
  - Replace the whole-card `onClick={open}` with a smaller summary-row toggle that calls `onToggleExpanded` (keep `Call`, `Message`, `Navigate` buttons working as today via `stopPropagation`).
  - Add a small `ChevronDown` indicator (rotates when expanded) on the right side of the duration/pickup column to make the affordance obvious.
  - Map tap still opens Google Maps directions (already wired in `MapHeroStatic`).
- Below the redesigned card, when `expanded`, render the existing `<NextUpTile … />` with all props from `useNextLessonDetails`, wrapped in a 14px-padding container and a matching white card with `borderRadius: 20`, `border: 0.5px solid rgba(26,82,160,0.10)`.

### 2. `src/components/instructor/NextUpTile.tsx`
- No edits needed — used as-is. It already manages its own internal expand sections, sheets and dialogs.

### 3. No backend / hook changes
- All required data is already returned by `useNextLessonDetails` (account balance, prepaid hours, check-in status, lesson status, last lesson plan, durationMinutes, etc.).

## Notes / decisions

- We keep two visually distinct cards (summary above, rich card below) rather than trying to merge them, so the new brand design is preserved and the existing internal animations/sheets in `NextUpTile` continue to work without refactor risk.
- Existing instructor business logic (route recording, end-lesson, reschedule, running-late, smart prompts, payments, vehicle health, etc.) is untouched.
- No memory/preferences changes.

## Files

- Edit: `src/components/instructor/MobileHomeRedesign.tsx`
