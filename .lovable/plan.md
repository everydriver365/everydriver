# public-courses audit — outcome

## Shipped: Batch A (findings 1–4)

`supabase/functions/public-courses/index.ts` now:

1. Uses `londonTodayStr` / `londonDateStr` / `londonDow` from `_shared/availabilityEngine.ts` instead of a local `formatDate` + `day.getDay()`. The 90-day search loop is anchored to London-today at UTC noon so day boundaries are correct under both BST and GMT.
2. Filters paused instructors out at the SQL layer (`availability_paused = false`) so a paused instructor never surfaces a "next available" date on the public discovery feed.
3. Loads `min_lead_hours` from the instructor row and computes `todayCutoffMin = londonNowMin() + leadMin`. For today, the candidate working day is rejected unless its latest `end_time` > `todayCutoffMin`.
4. Working-hours query now selects `start_time, end_time` so finding 3's cutoff has real values to compare against. Today's window is skipped entirely when no bookable time remains.

Net: parallel-logic surface area down (calls into shared London helpers, no twin), four wrong outputs become right outputs, zero behavioural risk on the two real partial-day override rows (both months out, both untouched).

---

## Knowingly broken (deferred to P3)

Two distinct items. Different urgencies. Both resolved by P3 (a canonical `instructor_availability_cache` populated by the engine, read by every discovery surface).

### Finding 5 — actively misleading today

`public-courses` does not consult `instructor_calendar_events` or `instructor_manual_blocks`. It has no concept of busyness. Any instructor with a busy calendar shows fabricated "next available" dates on the public discovery feed — typically "tomorrow", every day, regardless of whether they are solidly booked for the next fortnight. This is the steady state for every busy (i.e. best) instructor in the system. **Wrong now, every day, for most accounts that matter.**

### Finding 6 — dormant, activates 2026-01-11

When an `instructor_date_overrides` row has `is_available = true` with a partial-day `start_time` / `end_time`, the override short-circuit returns the date without checking whether the window has passed today or excludes bookable hours. Zero affected rows until 2026-01-11 (instructor `b7987…`, window 07:00–21:00) and 2026-03-02 (instructor `c9843…`, window 10:30–16:00). **Not wrong today; becomes wrong on a known date.**

---

## P3 — reframed

P3 was scoped as a scale/performance project ("precompute availability, it won't scale"). The audit changes its character:

> **P3 is correctness-urgent, not a scale optimisation.** The public discovery surface is the front door — and it is currently advertising fabricated next-available dates for the busiest instructors. The fix is structural: an `instructor_availability_cache` table with `next_available_date` populated by the canonical engine on calendar/manual-block/lesson change, and every discovery, listing, and AI surface reads from it. This also resolves the parallel-logic problem for `smart-schedule-suggestions`, `whatsapp-webhook`, and `ai-admin-receptionist` — they all become readers of the cache rather than independent implementers of availability.

---

## Tripwire — finding 6

**If P3 has not shipped by 2026-01-04, patch finding 6 standalone in `public-courses` before 2026-01-11.**

Standalone patch shape: extract `resolveDayWindows` from `src/lib/courseAvailability.ts` into `supabase/functions/_shared/dateOverrides.ts`, have the browser file import from `_shared/`, then call it from `public-courses` instead of the override short-circuit. Single source, no twin.

Tripwire location: this file + a calendar reminder for 2026-01-04.

---

## Halt

`smart-schedule-suggestions` waits. public-courses is resolved when Batch A is in (done), finding 6 is tracked with its date (done), and the brief reflects reality (done). Next audit surface does not begin until P3 is scoped or the tripwire fires.

---

## The real takeaway

This pre-flight was the audit working as it should. The Batch A scope hit an import wall on `resolveDayWindows` (lives in `src/lib/`, not Deno-reachable). The options were: a Deno twin (fast, recreates the exact failure mode this audit exists to expose), a structural extraction into `_shared/` (correct but is P3, not a side-quest), or honest deferral. The system declined the twin. That discipline is the thing that was missing when `availabilityEngine.ts` got duplicated in the first place.
