## Goal
Restore inline Gap Filler surfacing inside the new **compact Schedule list view** on mobile (`/instructor/schedule` → "Schedule" tab). It was lost when the compact view replaced the old list view. The Calendar grid view, lesson rows, day groupings, toggle, and downstream Gap Filler flow all stay untouched.

## Pre-flight findings
- **Underlying Gap Filler is intact.** `GapFillCard`, `GapFillSheet`, `useRealGapSlots`, `gapFeasibility.ts`, `/instructor/gaps` page, and the home-screen tile all still work.
- **Existing Calendar grid surfacing still works** — `MultiDayScheduleView.tsx` (lines 853–892) inserts a `<GapFillCard>` between adjacent timeline items when the effective gap, after subtracting `bufferMinutes + 10-min travel allowance` from each side, is ≥ `MIN_OFFERABLE_GAP_MIN` (60 min). This is the source-of-truth detection rule.
- **The compact view (`CompactScheduleListView.tsx`) does not insert any gap rows.** Only fix needed: add the same detection + a new green suggestion row, reusing `GapFillSheet` for the action.

No deeper recovery is required.

## What changes

### 1. `src/components/instructor/CompactScheduleListView.tsx`
- Accept new prop: `instructorId: string` and `instructorName: string` (passed in from the page so this view can open the existing `GapFillSheet`).
- Build a per-day **interleaved row list** of `{ kind: 'event', evt } | { kind: 'gap', startTime, endTime, gapMin }` by walking the day's sorted events and applying the **same rule used by `MultiDayScheduleView`**:
  - `sideAllowance = bufferMinutes + 10` (travel fallback)
  - `effectiveStart = prevEnd + sideAllowance`
  - `effectiveEnd = nextStart - sideAllowance`
  - Insert a gap row when `effectiveEnd - effectiveStart ≥ 60` minutes.
- Only insert gaps **between adjacent events** (matches existing Calendar grid behaviour — no synthetic full-day or before-first / after-last suggestions, since the existing surfacing doesn't add those either, and the spec says "match whatever pattern the existing Calendar grid view uses").
- Skip gaps whose `effectiveEnd` is in the past (today only).
- Render a new `GapSuggestionRow` subcomponent matching the spec exactly:
  - Container: `#E8F3E8` bg, 10px radius, `10px 12px` padding, `4px 8px` margin, flex centre, 10px gap.
  - Left: 28×28 white tile w/ 7px radius, lucide `CalendarPlus` icon (16×16, `#3B8B3B`, stroke 2).
  - Middle: title `Open slot · HH:MM – HH:MM` (13px / 500), subtitle `{durationStr} gap — offer to waitlist?` (11px `#6E6E73`).
  - Right: green Fill button (`#3B8B3B` bg, white text, 8px radius, `6px 12px`, 12/500).
- On Fill tap, open the existing `GapFillSheet` pre-populated with `date / startTime / endTime`.
- Empty days: keep the existing "No lessons" placeholder. Do not introduce a full-day suggestion (matches Calendar grid pattern; spec explicitly allows this).
- Days with fully-booked, no-gap schedules: render no green rows (calm state).

### 2. `src/pages/InstructorSchedule.tsx`
- Pass `instructorId={instructorId}` and `instructorName={instructor?.name ?? 'Your instructor'}` into `<CompactScheduleListView />`. No other changes — toggle, header, sync, calendar grid path all stay identical.

### 3. New small bit of data fetching
- The compact view needs `bufferMinutes` for the same instructor (used by detection). Fetch it once via `supabase.from('instructors').select('lesson_buffer_minutes').eq('id', instructorId).maybeSingle()` inside the component (same pattern `MultiDayScheduleView` already uses). Falls back to `0`.
- Reuse `react-query`'s existing invalidation: when the user completes the Gap Filler flow (`onSent`), call `calendar.refetch()` via a callback so the suggestion row disappears and the new lesson appears once it's booked. (No additional animation work — the existing data flow handles re-render.)

## What stays untouched
- `MultiDayScheduleView` (legacy list / Calendar surfacing).
- `MobileMonthCalendarView`, `InstructorCalendar`, `GoogleStyleScheduleView`.
- `GapFillSheet`, `GapFillCard`, `GapsFiller`, `useRealGapSlots`, `gapFeasibility.ts`.
- Home screen "Fill gaps" tile and `/instructor/gaps` page.
- Calendar/Schedule toggle, day headers, lesson rows, conflict pills, Live status, Google Calendar sync, FAB, lesson tap-through, lesson creation.

## Files touched
- **Edit** `src/components/instructor/CompactScheduleListView.tsx` — add interleaved gap detection + `GapSuggestionRow` + `GapFillSheet` integration.
- **Edit** `src/pages/InstructorSchedule.tsx` — pass `instructorId` + `instructorName` props (and an `onGapFilled` refetch callback) into the compact view.

## Verification checklist (post-implementation)
1. Compact Schedule view (mobile, `/instructor/schedule`, "Schedule" tab): days with ≥60-min effective gaps between two lessons show a green suggestion row at the chronological position.
2. Calendar grid view: `MultiDayScheduleView` Gap Filler still appears (no regression).
3. Home tile "Fill gaps" still routes to the existing Gap Filler screen.
4. Tap Fill → `GapFillSheet` opens with the slot pre-populated.
5. After sending offer / completing flow, the green row vanishes when the slot is booked (via `calendar.refetch`).
6. Days with no fillable gaps remain calm — no green rows.
7. Past gaps on today are not rendered.
