

## Redesign: Today's Schedule card (instructor mobile)

Replace the look of the existing `HomeTodaySchedule` component on `/instructor` with a premium SaaS-style card. All live data wiring is preserved — only the visual shell, tab structure, and footer change.

### Live data — unchanged

Component continues to use:
- `useTodayOverview(instructorId)` — today's lesson count + expected earnings
- `useDayLessons(instructorId, today)` — today's lessons
- `useDayLessons(instructorId, tomorrow)` — tomorrow's lessons (new call, same hook)
- `useDayLessons` called for each day Mon–Sun → "Week" tab (new, same hook, parallel queries)
- `useWeeklyGoals(instructorId)` → `earningsThisWeek` for the header stat
- `AddLessonSheet` for the "Add lesson" CTA (already wired)
- Lesson row navigation: continues to link to `/instructor/pupils/:pupilId`

No schema changes, no new hooks, no new edge functions.

### Visual structure

1. **Card shell** — white, rounded 20px, soft shadow, on the existing warm page background. Manrope loaded once via `<link>` injected in `index.html`; JetBrains Mono for times/dates/prices/counts.

2. **Compact gradient header** — navy `#1e3a8a` → royal `#3b5fd4`, subtle white radial glow top-right, 14/12/20 padding.
   - Top row: amber pulsing dot + "Today's schedule" (white 600/14) on the left; mono uppercase "WED 22 APR · WK 17" (built from `date-fns` `format(now,'EEE d MMM')` + `getISOWeek`) on the right.
   - 3-column stats grid:
     - **TODAY** — `overview.lessonCount` + " lessons"
     - **EARNED** — `£` + `overview.expectedEarnings` (rounded)
     - **THIS WEEK** — `£` + `weeklyGoals.earningsThisWeek`

3. **Tab bar** — Today / Tomorrow / Week with count badges (`todayLessons.length`, `tomorrowLessons.length`, `weekLessons.length`). Active = blue text, blue underline, light-blue badge `#dbeafe`.

4. **Content area (24px padding)**
   - **Today tab, no lessons** → empty-state hero ("Your day is clear" + calendar icon) followed by a "Tomorrow — Thu 23 Apr" preview strip and the tomorrow lesson rows.
   - **Today tab, has lessons** → hides the empty-state, renders today's lessons as the primary list.
   - **Tomorrow tab** → tomorrow's lessons as a primary list.
   - **Week tab** → lessons grouped by day with a small day-header strip per group.
   - **Lesson row** — fixed time column (mono), 3px colored category bar, pupil name + lesson type, secondary metadata line ("Postcode · Lesson type · Duration"), price on the right in mono. Category color derived deterministically from `lessonType` (`Test Prep` → amber, `Mock Test` → rose, others → emerald) — matches existing palette in `TodayMiniTimeline`.
   - Row click → existing pupil navigation via `onLessonClick` callback.

5. **Footer** — light bar `#fafbfd` with top hairline.
   - Left: "View full calendar →" → `navigate('/instructor/schedule')`.
   - Right: dark ink button with "+" → opens existing `AddLessonSheet`.

### Mapping from driving-lesson data to the spec's tutoring fields

The spec mentions `subject`, `yearGroup`, `format`, `topic` (tutoring concepts). For this driving-instructor app the row will display real lesson fields instead, with the same visual layout:
- `studentName` → `pupilName`
- `subject` → `lessonType` (e.g. "Standard", "Test Prep")
- secondary metadata line → `pickupPostcode · durationMinutes · paymentStatus`
- `price` → `amountDue`
- `category` color → derived from `lessonType` (no new field)

This keeps the design language identical without inventing data we don't have.

### Files

- **Edit** `src/components/instructor/HomeTodaySchedule.tsx` — full visual rewrite, same props (`{ instructorId }`), same hook calls plus the additional tomorrow + week-day `useDayLessons` calls.
- **Edit** `index.html` — add Manrope + JetBrains Mono Google Fonts `<link>` tags in `<head>`.
- No changes to `InstructorMobileHome.tsx` (it already renders `<HomeTodaySchedule instructorId={instructorId} />`).
- No changes to hooks, schema, or any other components.

### QA at 390×585

- Header stats remain on one row (font sizes step down at <360px).
- Tabs switch content; counts update from live queries.
- Empty Today state shows hero + tomorrow preview; populated Today hides hero.
- "Add lesson" opens the existing sheet; "View full calendar" navigates to `/instructor/schedule`.
- Tapping a lesson row navigates to the pupil profile (existing behaviour preserved).
- Loading shimmer kept for all three tabs.

