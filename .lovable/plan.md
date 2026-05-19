## Goal

Replace every `"—" / "Needs data source"` placeholder on `/instructor` (`HybridDashboard`) with a live DB query, while keeping the **LIVE DATA ONLY** rule — if a metric has zero rows, show `0` (or empty state), never invent values.

## What's already wired (no change)

Pupils count · Payments this month · Outstanding · Account balance · Hours taught · Schedule (Today/Tomorrow/+3) · Outstanding alert banner.

## What this plan wires

### 1. Stats row (top 6 tiles)

| Tile | Source | Query |
|---|---|---|
| Lessons booked | `scheduled_lessons` | this-month count where `status != 'cancelled'` |
| Cancelled | `scheduled_lessons` | this-month count where `status = 'cancelled'` |
| Tests booked | `test_requests` | count where `test_date >= today` and `status` not in (`cancelled`,`completed`) |
| Pass rate | `driving_test_results` | last 12 months: `passed / total * 100`, exclude `is_mock=true` |

All return `0` / `—` cleanly when no rows. No `??` fallbacks on live values.

### 2. DVSA Standards Check card

Replace hardcoded `hasResults = false` with a query of `instructor_standards_check` for the current instructor. If rows exist → show latest result + date + a "View all" link. If none → keep current empty state + CTA.

### 3. Earnings → Month target

Currently hardcoded `null`. The `instructors` table has no monthly target column. Two options handled in code:
- If a target exists in `instructors` (none today) → show it.
- Otherwise → render a small inline **"Set target →"** link pointing to `/instructor/settings/plan-billing` (or the closest existing settings page), per the live-data rule (no invented number).

No new migration in this plan — we'll surface the empty state. If you later want a real saved target, that's a follow-up migration adding `instructors.monthly_earnings_target numeric`.

### 4. Function tile stats (12 tiles)

| Tile | Source |
|---|---|
| Schedule | already wired (`todaysLessonCount today`) |
| Pupils | already wired |
| Waiting list | `lesson_waitlist` count for instructor |
| Payments | already wired (`£X due`) |
| Test swap | `test_swap_offers` open count for instructor |
| Progress | leave as link only (no single meaningful number) — show `—` and label "Open" |
| Courses | `instructor_courses` active count |
| CPD log | `cpd_log_entries` count this year (or `X / target` if `cpd_year_target` set) |
| Invoices | `invoices` unpaid count for instructor |
| Find a slot | leave as link only — `—` / "Open" |
| Settings | leave as link only — `—` / "Open" |
| DVSA check | reuse standards-check query: latest result label or `—` |

Tiles that are pure navigation (Progress / Find a slot / Settings) get the substat removed rather than showing a misleading "—".

## Technical approach

Add a single hook `useInstructorDashboardStats(instructorId)` in `src/hooks/` that runs the new queries in parallel via `useQuery` + `Promise.all`, cached 2 min (matches `useInstructorPeriodStats`). Returns:

```ts
{
  lessonsThisMonth: number;
  cancelledThisMonth: number;
  testsBooked: number;
  passRatePct: number | null;        // null when zero results
  passRateSampleSize: number;
  waitingListCount: number;
  testSwapOpenCount: number;
  coursesCount: number;
  cpdThisYear: number;
  cpdTarget: number | null;
  invoicesUnpaid: number;
  latestStandardsCheck: { date: string; result: string } | null;
  loading: boolean;
}
```

All queries filter by `instructor_id = instructorId` (RLS-friendly).

Edit `src/components/instructor/dashboardV3/HybridDashboard.tsx`:
- Call the new hook.
- Replace each `value: "—"` with the live value (or keep `—` only where the tile has no meaningful number).
- Update DVSA card to render latest result when present.
- Update Earnings "Month target" to show "Set target →" link instead of hardcoded `—`.

## Out of scope (will not touch)

- Mobile layouts (per memory rule).
- Adding new DB columns (e.g. monthly earnings target) — surface empty state instead, follow-up if you want persistence.
- Right rail, quick actions, schedule card — already wired.
