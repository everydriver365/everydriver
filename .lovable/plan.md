## Decision: Option 3 — defer findings 5 and 6 to P3

Both override rows are months out (2026-01-11 and 2026-03-02). Finding 6 harms no one today. Pulling `resolveDayWindows` into `_shared/` is the correct structural move but it *is* P3 — extracting it now in isolation, outside the precompute design, is letting the batch drive the architecture. Option 2 (a Deno twin) is exactly the trap the audit exists to expose; declining it is the audit doing its job.

---

## Batch A — ship in one pass (`supabase/functions/public-courses`)

Four edits, all pure reductions in parallel logic. No behavioural risk on real accounts (the one risky edit was finding 6, now deferred).

1. **Finding 1 — timezone correctness.** Replace `formatDate(day)` → `londonTodayStr()` / `londonDateStr(day)` and `day.getDay()` → `londonDow(day)`. Calls into existing shared helpers, deletes the local equivalents.
2. **Finding 2 — paused instructors.** Add `availability_paused = false` to the instructor SQL filter. One where clause.
3. **Finding 3 — min lead hours.** When the candidate day is London-today, reject slot times earlier than `londonNowMinutes() + min_lead_hours * 60`. One comparison.
4. **Finding 4 — past-cutoff for today.** Apply the same `londonNowMinutes` cutoff to today's window so the function never returns a start time that has already passed.

Net: ~15 lines removed, ~8 lines added, every new line is a call into the canonical shared module. Parallel-logic surface area decreases.

---

## Deferred — write into the brief as two distinct items

**Finding 5 — actively misleading today.** `public-courses` does not consult `instructor_calendar_events` or `instructor_manual_blocks`. Any instructor with a busy calendar shows fabricated "next available" dates on the public discovery feed. This is the steady state for every busy (i.e. best) instructor in the system. Wrong now, every day, for most accounts that matter.

**Finding 6 — dormant, activates 2026-01-11.** When an `instructor_date_overrides` row has `is_available = true` with a partial-day `start_time`/`end_time`, `public-courses` short-circuits at lines 49–51 and returns the date without checking the override window. Zero affected rows until 2026-01-11 (instructor `b7987…`), then a second row 2026-03-02 (instructor `c9843…`). Not wrong today; becomes wrong on a known date.

Both resolved by P3 (the canonical `instructor_availability_cache` populated by the engine, read by every discovery surface).

---

## Tripwire on finding 6

Deferral without a deadline is forgetting with extra steps. Add a tracked marker — issue / calendar entry / whatever the team uses — with the rule:

> **If P3 has not shipped by 2026-01-04, patch finding 6 standalone in `public-courses` before 2026-01-11.**

The standalone patch, if it fires, would be option 1 (extract `resolveDayWindows` into `supabase/functions/_shared/dateOverrides.ts`, refactor `src/lib/courseAvailability.ts` to import it). The tripwire makes "deferred" a commitment, not a hope.

---

## Steps in order

1. Edit `supabase/functions/public-courses/index.ts` — apply findings 1, 2, 3, 4 in one pass.
2. Edit `.lovable/plan.md` / the brief: P3 reframed (correctness-urgent, not scale), "knowingly broken" section lists finding 5 and finding 6 as separate items with the urgency framing above, finding-6 tripwire recorded with the 2026-01-04 / 2026-01-11 dates.
3. **Halt.** `smart-schedule-suggestions` waits. Public-courses is resolved when Batch A is in, finding 6 is tracked with its date, and the brief reflects reality.

No code outside `supabase/functions/public-courses/index.ts`. No twin of `resolveDayWindows`. No extraction into `_shared/` this week.
