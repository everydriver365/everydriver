# Apply all instructor-app UI improvements

This is a sizable multi-file change. I'll do it in 5 sequential batches so each lands cleanly and can be reviewed in the preview before the next one.

---

## Batch 1 — Today's Pulse polish
File: `src/components/instructor/TodayAtAGlance.tsx`

- Make every chip tappable (buttons, not divs) with these targets:
  - **Next Up** → opens lesson detail sheet (uses existing nextLessonId)
  - **Remaining** → scrolls to the Today's Schedule tile on the home page
  - **Scheduled** → navigates to `/instructor/schedule?view=schedule&date=today`
  - **Earnings** → navigates to `/instructor/payments?range=today`
- Hide the Next Up chip entirely when there's no upcoming lesson (rather than showing "—") so the strip starts on Remaining.
- Add a postcode badge to the Next Up chip (same outward-code helper already in this file, fed from the `nextLesson`'s pickup_postcode/pupil postcode).
- End-of-day state: when no remaining lessons and at least one was completed today, replace the chip strip with a single hero summary card: "Day complete · {hours}h taught · £{earnings} collected · Review day →". Tapping opens the EOD summary route.
- Apply `tabular-nums` to every number that ticks (countdown, time, totals).

## Batch 2 — Today's Schedule tile (home)
File: `src/components/instructor/HomeTodaySchedule.tsx`

- Group rows into Morning (<12:00), Afternoon (12:00–17:00), Evening (≥17:00) sections, separated by thin uppercase tracked dividers ("MORNING", etc.) — only render sections that have rows.
- Insert a travel-time chip between consecutive rows when:
  - both have postcodes, AND
  - estimated drive distance is >2 miles (use existing buffer/travel-time util if present; otherwise haversine on cached postcode coords).
  - Render as a full-width inset chip: `↳ 8 min drive · 3.1 mi`, muted text, no border.

## Batch 3 — Schedule page
Files: `src/components/instructor/MultiDayScheduleView.tsx`, `src/components/instructor/MobileMonthCalendarView.tsx`

- **Schedule view** (MultiDayScheduleView):
  - Sticky floating "Today · {EEE d}" pill, bottom-right above the bottom nav, visible only when today's section is scrolled out of view; tap scrolls back to today's anchor with smooth behaviour.
  - Empty-day inline state: keep the day header, replace the empty body with a single muted row: "No lessons · {free hours}h free · Offer to fill →" linking to Gap Filler.
  - Conflict rows: 2px left bar in red + small "Overlap" tag in the row's metadata line. Remove the separate banner if currently rendered above conflicting rows.
- **Calendar (month) view** (MobileMonthCalendarView):
  - Add a 1px primary-coloured "now" line across the current time on the day-detail timed list when today is the active day. Position computed from current minutes-from-midnight against the rendered hour scale.

## Batch 4 — Gap Filler card
File: `src/components/instructor/GapFillCard.tsx`

- Surface the top candidate inline: under the existing "{n} Pupils May Fit · {duration}" title, show a single row with avatar, pupil name, and distance ("Sarah J · 2.1 mi") when `totalCount ≥ 1`. Tapping the card still opens the full sheet.
- Colour-code the card's left accent bar by gap length:
  - <60 min → amber (`#B94A00`)
  - 60–89 min → blue (current default)
  - ≥90 min → green (`#0D7A5C`)

## Batch 5 — Global polish & quick wins
- **Card chrome standardisation**: introduce a tiny shared util `src/components/instructor/ui/cardChrome.ts` exporting one className constant `INSTRUCTOR_CARD = "rounded-2xl bg-white ring-1 ring-black/5"` plus an inline `boxShadow: "0 2px 12px -4px rgba(0,0,0,0.04)"` style. Apply to: `TodayAtAGlance`, `HomeTodaySchedule`, `GapFillCard`, top-level wrappers in `MultiDayScheduleView` day cards. Leave other portals untouched.
- **Section headers**: standardise the home-page section headers ("Today's Schedule", "Gap Filler", etc.) to uppercase tracked treatment per the iOS consistency memory.
- **Tabular numerals**: add `font-variant-numeric: tabular-nums` to all home/schedule numbers (countdowns, times, durations, money) — done at component level inline.
- **Pull-to-refresh**: wrap `InstructorPortal` home and schedule routes in a lightweight pull-to-refresh component (use existing if one is in the codebase; otherwise add a small custom one using touch events + `react-query` `refetch`).
- **Haptic tap**: add a thin `useHaptic()` hook calling `Capacitor Haptics.impact({style:'Light'})` when running native; no-op on web. Wire to chips, schedule rows, and gap-filler card.
- **Swipe actions on lesson rows** (Today's Schedule + Schedule view): left swipe reveals "End lesson" (primary) and "Reschedule" (neutral); right swipe reveals "Message pupil" (blue). Use a small custom `SwipeRow` component (transform on touchmove + snap thresholds).
- **Skeletons**: replace generic grey blocks in the four touched components with shimmer skeletons matching final layout (already partly done in TodayAtAGlance — extend pattern).

## Out of scope
- Other home layouts (lockscreen, ios-native, compact, mission-control, bestmate, widgets) — only the default/`schedule` layout is updated.
- Desktop schedule view.
- Any data model or RLS changes — purely UI/UX.
- Gap Filler internals (matching logic, sheet content) — only the card surface.

## Sequencing
Each batch is a discrete commit-sized chunk. After Batch 1 lands, I'll continue straight through Batches 2–5 unless you stop me. Total expected change: ~6 files edited, 1–2 small new files (cardChrome util, useHaptic hook, SwipeRow component).
