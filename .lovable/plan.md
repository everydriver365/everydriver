## Fix accuracy issues on Instructor Payments (mobile)

Scope: `src/pages/InstructorPay.tsx` + `src/hooks/useDailyEarnings.ts`. UI/data only — no business logic or layout changes.

### 1. "This Month" hero under-reports mid/late month
`useDailyEarnings` only fetches `lesson_history` from the last 14 days, so `thisMonth` misses lessons earlier in the month.

- Change the query window to `gte(lesson_date, startOfMonth(subMonths(today, 1)))` so it always covers the current month + last month in full (still bounded, still fast).
- Keep the 14-day daily sparkline by deriving it from the same dataset.

### 2. "Recent Payments" tile shows all-time count
The `payment_history` count query has no date filter.

- Filter to `recorded_at >= startOfMonth(now)` and relabel sublabel to "This Month" (or last 30 days — pick one; recommend month-to-date to match the hero).

### 3. "Pupil Balances" tile shows pupil count, not a balance
The number displayed is `pupils.length`.

- Replace with **total credit on account**: sum of `account_balance` where `> 0`. Keep label "Pupil Balances" or change to "Credit on Account" (recommend the latter for clarity).
- Tile expansion already shows the per-pupil list — unchanged.

### 4. Hardcoded `40` hourly-rate fallback
Violates `mem://constraints/no-hardcoded-fallbacks-live-data-only`.

- In `useDailyEarnings`: stop defaulting `hourlyRate` to `40`. If the instructor has no `hourly_rate` set, return `hourlyRate: null` and skip the per-hour tile (or render "—" with a "Set your rate" link to settings).
- In `InstructorPay.tsx` "Per Hour" stat: render `£{earnings.hourlyRate ?? "—"}` and link the tile to `/instructor/settings` when null.

### Technical details

- Files touched: `src/pages/InstructorPay.tsx`, `src/hooks/useDailyEarnings.ts`.
- New date-fns imports if needed: `startOfMonth`, `subMonths`.
- `EarningsData.hourlyRate` type changes from `number` to `number | null`; update consumers (grep usage — likely only this page).
- No DB/schema/edge-function changes. No layout changes.

### Verification

- Manually verify on preview: hero "This Month" matches sum of lessons in current month; "Recent Payments" matches month-to-date row count in `payment_history`; "Credit on Account" matches sum of positive `account_balance`; instructor with no `hourly_rate` shows "—" not 40.
