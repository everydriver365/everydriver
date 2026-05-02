## Confirmation feedback loop

Goal: at a glance, you can tell whether each pupil has confirmed, declined, or hasn't responded yet — both on the Next Lesson tile and across the schedule. Plus a one-tap way to chase a pending pupil.

The data already exists (`scheduled_lessons.check_in_status` = `confirmed` / `pending` / `declined`) and there's already a `LessonCheckInBadge` component. The fix is: render it consistently everywhere it's missing, make it more visible on the Next Lesson tile, and add a "Nudge" action when pending.

---

### 1. Next Lesson tile — expanded hero

Today the small "Awaiting" badge sits next to the "UP NEXT" label only when the tile is collapsed. When you expand it, the badge disappears, which is why the feedback feels weak.

Change:
- Show the confirmation state in the expanded hero card too — a small chip on the right of the "Up next" eyebrow row (top-right of the white card), aligned with current iOS pill styling.
- States:
  - `confirmed` → green check + "Confirmed"
  - `pending` / `null` → amber clock + "Awaiting"
  - `declined` → red alert + "Declined"
- When `pending` and the pupil has a phone number, the chip becomes tappable and acts as a one-tap "Nudge" — fires the existing `handleMessage` flow (WhatsApp/SMS) with the standard reminder body. Subtle haptic + toast: "Reminder sent".
- After tapping, chip flips to "Reminder sent" for ~3s, then back to "Awaiting" until they actually respond. (Local UI state only — no schema change.)

The existing "Pupil has not confirmed yet" smart-alert nudge stays as-is (it's the louder banner inside the alerts strip).

### 2. Schedule rows — fill the gaps

`TodayScheduleView` and `NewMobileScheduleView` already render `<LessonCheckInBadge>`. `MultiDayScheduleView` (the main schedule grid) fetches `check_in_status` but never displays it.

Change:
- In `MultiDayScheduleView`'s `ScheduleListRow`, add the same compact check-in chip in the trailing badges column (above the existing `StatusPill`, below `OVERDUE`).
- Pass `checkInStatus` through from the lesson row (already in `lesson.check_in_status`) into `ScheduleListRow` via a new optional `checkInStatus` prop.
- Hide the chip for past lessons (no value once the lesson has happened), and for non-lesson rows (external/block/all-day).

### 3. Visual rules

- Reuse `LessonCheckInBadge` exactly as it is — same colours, icons, labels — so confirmation feedback is identical wherever it appears.
- Compact size on schedule rows: `text-[10px] py-0 px-1.5 h-5` (matches the collapsed Next Lesson treatment).
- On the expanded Next Lesson hero: same compact pill, right-aligned beside "Up next".
- "Nudge" interaction is iOS-native feel: light press scale, success haptic, toast confirmation.

### What we are NOT changing

- Database schema, RLS, or how confirmation state is set (that still flows from pupil portal / WhatsApp / email reminders).
- The smart-alerts strip's existing "Pupil has not confirmed yet" banner.
- The unified Navigate / Call / Text / status segmented control we just built.
- Any other lesson status logic.

### Files touched

- `src/components/instructor/NextUpTile.tsx` — add badge (+ tap-to-nudge) inside expanded hero header.
- `src/components/instructor/MultiDayScheduleView.tsx` — pass `check_in_status` into `ScheduleListRow`, render chip in trailing badge column for upcoming lessons only.
- (Optional) tiny tweak to `LessonCheckInBadge.tsx` only if we need an `interactive` variant for the nudge affordance — likely not, the wrapper button on the Next Lesson tile is enough.

Ready to build when you approve.