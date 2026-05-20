## Response to your pushback — agreed, with one correction

### Finding 7 resolved: it's a real sixth bug

Schema check: `instructor_date_overrides` has nullable `start_time` and `end_time`. Live data: 2 rows in production have `is_available = true` with non-null `start_time` and `end_time` — confirmed partial-day "available between X and Y on this date" overrides. The `public-courses` short-circuit at lines 49–51 returns `dateStr` the moment it sees any `is_available = true` override and never reads start/end. So on those two rows, the function returns the date as "next available" even if the override window has already passed for today, or even if the rest of the day is otherwise blocked.

Cross-check on the canonical helper: `src/lib/courseAvailability.ts` lines 217–220 already handles this correctly — when an `is_available = true` override has start/end, it parses them into a partial-day window. The engine itself doesn't resolve overrides; `courseAvailability.resolveDayWindows` does, and it's the right place. `public-courses` is the only file that gets override semantics wrong.

So: finding 7 promoted to a confirmed sixth bug. Same class as the others — public-courses reimplements something the canonical helper already does correctly.

### Yes, agreed on the split — finding 5 is not in the tactical batch

You're right and I was wrong to recommend tactical for finding 5. Reading my own list back, the busyness patch IS reimplementing `buildDayConflicts`, and shipping it would entrench exactly what this whole audit exists to expose. The asymmetry you named is the deciding fact: findings 1, 2, 3, 4 are each one helper call or one SQL filter — they *reduce* parallel logic. Finding 5 is a second engine. Different class, different decision.

And your priority correction stands: finding 5 is the worst, not the fifth-worst. An instructor solidly booked for two weeks shows "Next available: Tomorrow" on the public discovery page, every day. That's not edge-case drift, that's the steady state for every busy instructor in the system. The audit understated it because I ordered by reading sequence, not by impact. Reordered: 5 first, then 3 (paused instructors still publicly listed), then 4, then 1+2+6 (timezone/override correctness).

### The split

**Batch A — ship as actual reduction in parallel logic** (findings 1, 2, 3, 4, 6):
- Switch `formatDate` → `londonTodayStr` and `day.getDay()` → `londonDow` (calling shared helpers, not duplicating logic).
- Add `availability_paused = false` to the instructor SQL filter (one where clause, zero engine logic).
- Add `min_lead_hours` cutoff for today (one comparison against `londonNowMinutes`).
- Replace the inline override handling with a call to `courseAvailability.resolveDayWindows` for the day — that already handles partial-day `is_available=true` correctly, fixing finding 6 by deletion rather than reimplementation.

Net effect: ~25 lines deleted, ~10 lines added, all of them calls into existing canonical helpers. Parallel-logic surface area goes down, not up.

**Batch B — explicitly deferred to P3** (finding 5):
- Busyness from `instructor_calendar_events` + `instructor_manual_blocks` is not patched in `public-courses`. It stays knowingly broken for a few more days. The fix is `public-courses` reading `next_available_date` from a precomputed availability column populated by the engine. That deletes `findFirstAvailableDate` entirely and ends the parallel-logic question for this surface.

This means after Batch A ships, the public discovery feed will still show fictional "next available" dates for busy instructors. That's an honest tradeoff: shipping a wrong-but-less-wrong number for 3–5 more days is preferable to entrenching a second busyness engine that we then have to delete anyway.

### Brief edit — P3 reframed

P3 currently reads (per your earlier brief) as a scale/performance item: "won't scale, precompute availability." The audit changes its character. Proposed rewording for the brief:

> **P3 — Precomputed availability table (moved up; reframe).** This is no longer a scale optimisation. `public-courses` audit confirms the public discovery page is showing fabricated "next available" dates for any instructor with a busy calendar — i.e. the busiest, best instructors — because the function has no concept of busyness. The fix is structural: a `instructor_availability_cache` table with `next_available_date` populated by the canonical engine, and every discovery/listing surface reads from it. Same project also resolves the parallel-logic problem for `smart-schedule-suggestions`, `whatsapp-webhook`, and `ai-admin-receptionist` — they all become readers of the cache rather than independent implementers of availability.

### What I'm asking you to confirm before any code moves

1. Batch A as scoped above — five edits, all reductions, including the finding-6 fix via `resolveDayWindows`. Ship it.
2. Finding 5 explicitly deferred to P3, with the brief edited as above. No tactical busyness patch.
3. After Batch A lands and the brief is updated: halt on this surface. `smart-schedule-suggestions` waits.

If you confirm, I'll do Batch A in one pass and stop. If you want any of those four edits to drop from Batch A (e.g. you'd rather even the `resolveDayWindows` swap waited for P3 because it changes behaviour), say so — that's the one edit in Batch A that has any behavioural risk worth flagging, because it will start respecting partial-day overrides correctly and may shift `nextAvailable` for the two instructors with such rows.
