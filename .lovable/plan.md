## Goal

Redesign the "Today's schedule" card on the instructor mobile home (`HomeTodaySchedule.tsx`) per the spec: per-lesson states, EOL prompt on completed-without-notes lessons, smaller stat tiles, inline conflict warnings, sentence-case eyebrow. All existing behaviour (data fetching, Today/Tomorrow toggle, lesson tap-through, Add lesson, View full calendar) stays.

## Scope

Single file: `src/components/instructor/HomeTodaySchedule.tsx` (used by `InstructorMobileHome`). No data-layer changes — `useDayLessons` already returns `status`, `startTime`, `durationMinutes`, `notes` shape via `scheduled_lessons`. Add `notes` to the select in `useDayLessons`/`useTodayRemainingLessons` so EOL completeness can be derived without changing the row tap routes or backend.

## Header

- Eyebrow: sentence case `"Today's schedule"` / `"Tomorrow's schedule"`, 11px / 500 / `#2B7BC8`, uppercase via CSS, `letter-spacing: 0.3px`. Drop the leading dot.
- Day name: 22px / 500 / `#000` / `-0.4px`.
- Subtitle format: `"{d MMMM} · {doneCount} of {total} done"`, or `"{d MMMM} · no lessons today"`. 12px / `#6E6E73`.
- Remove the top-right "N lessons" pill entirely.

## Today/Tomorrow toggle

Keep the existing two-segment control and its state, restyled to spec (8px radius, 3px padding, 6px inner radius, 12px labels). Wiring to `setTab` unchanged.

## Compact stat tiles

Replace the two large white cards with a horizontal flex row, two tiles, `flex: 1` each:

- Container: `#F8FAFB`, `0.5px solid #E5E5EA`, `8px` radius, `8px 10px` padding, gap 8 between tiles, 22×22 icon chip (6px radius), 12×12 line icon.
- Lessons tile: blue calendar icon, hero `"{count} · {totalHours}h"` where the `· {h}h` suffix is 10px / 400 / `#6E6E73`. Label "Lessons".
- Earned tile: green £ icon, hero `"£{amount}"`. Label "Earned".

Same data sources as today (`overview` for today, derived from `lessons` for tomorrow).

## Lesson list — three states

Add helpers inside the file:

- `getLessonState(lesson, now, isTomorrow)` → `"completed" | "live" | "upcoming"`.
  - `cancelled` → skipped (already filtered upstream).
  - Tomorrow tab: always `"upcoming"`.
  - Today: compute start/end seconds; `now >= end` or `status === "completed"` → completed; `start <= now < end` → live; else upcoming.
- `isEOLComplete(lesson)` → `notes` is non-empty trimmed string. (Comment notes the limitation; no schema change.)

### State 1 — Completed
Row at `opacity 0.55`, no background. Time `line-through`. 3px bar `#C7C7CC`. Pupil name `line-through`. "Done" pill (green) at full opacity. Subtitle line-through.
EOL prompt rendered only when `!isEOLComplete(lesson)`: amber `#FBF1DE` button, full opacity, exclamation icon + "Complete EOL", routes to `/instructor/pupils/{pupilId}` (same destination as the row tap — preserves current routing; if a dedicated EOL route exists later it can swap in).

### State 2 — Live
Tinted container `#E6F1FB`, 10px radius, padding 12. Bar `#2B7BC8`. "Live" pill `#FBEAEC` / `#C8434F` with pulsing dot. Status line `"In progress · {N} min remaining"` where N is `Math.max(0, ceil((endSec - nowSec)/60))`. Trailing chevron blue. Tap → existing `/instructor/pupils/{pupilId}` route (unchanged from today).

### State 3 — Upcoming
Plain row. Bar uses calendar source colour: driving test `#C8434F`, else `#2B7BC8` (same logic as today). "Conflict" pill if this lesson overlaps with any other in the same day. Chevron `#6E6E73`.

Hairline `0.5px #E5E5EA` between adjacent non-live rows. Live rows use their tinted card and skip dividers.

"Review" pill — keep the existing pupil-name corruption check if present; if not present today, this spec is additive only, so render the pill behind the same boolean (initially always false; no behaviour regression).

## Conflict detection + banner

Pure-derivation utility inside the component:

- Build sorted intervals `[startSec, endSec, id]` from `lessons`.
- `conflictIds` = set of ids overlapping at least one other.
- `firstConflictId` = first lesson id (in render order) that is in `conflictIds`.

Render an inline red banner directly above the row whose id === `firstConflictId`:

- `#FBEAEC` bg, 10px radius, 10×12 padding, triangle-exclamation icon `#C8434F`, message `"Two lessons booked at {HH:mm} — review and resolve"` using the conflict cluster's start time.

Each conflicting upcoming row also gets the inline "Conflict" pill. No change to any existing top-of-page conflict surfacing.

## Footer

`border-top: 0.5px #E5E5EA`, `padding-top: 14px`. Left: "View full calendar" text link → `/instructor/schedule` (unchanged). Right: blue "Add lesson" pill → opens existing `AddLessonSheet` (unchanged).

## Empty state

When `lessons.length === 0`: stat tiles still render with `0 · 0h` and `£0`, then the calm placeholder (40×40 chip, "No lessons today", "Perfect time to catch up on admin"), then footer.

## Data-layer touch

Add `notes` to the `select` in `src/hooks/useDayLessons.ts` and `src/hooks/useTodayRemainingLessons.ts` and surface it on the `TodayLesson` type as `notes: string | null`. No other consumers depend on field absence; query keys/cache shape unchanged.

## Out of scope

- `NextUpTile`, other home views (`CleanHomeView`, `BestMateHomeView`, `IOSNativeHomeView`).
- Conflict detection algorithm itself beyond the trivial overlap derivation needed to render pills (no backend change).
- Adding a new EOL route — taps continue to land on the existing pupil page.
- Mobile layout changes elsewhere.

## Verification

- Today with mixed lessons: completed rows struck through with grey bar, EOL prompt shows only when `notes` is empty, in-progress lesson is highlighted with countdown, upcoming rows are crisp with correct accent colour.
- Two overlapping lessons: red banner above the first, "Conflict" pill on each affected row.
- Tomorrow tab: every row renders as upcoming regardless of clock.
- Empty day: placeholder + £0 / 0·0h tiles, footer still works.
- Add lesson and View full calendar still open the same destinations.
