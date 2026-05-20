---
name: P3 tripwire — finding 6 (public-courses partial-day overrides)
description: If P3 (instructor_availability_cache) has not shipped by 2026-01-04, patch finding 6 standalone in public-courses before 2026-01-11.
type: constraint
---

# Tripwire — finding 6 in `supabase/functions/public-courses/index.ts`

**Rule:** If P3 (canonical `instructor_availability_cache` populated by the engine) has not shipped by **2026-01-04**, patch finding 6 in `public-courses` standalone before **2026-01-11**.

## What finding 6 is

When `instructor_date_overrides` has `is_available = true` with a partial-day `start_time` / `end_time`, the override short-circuit in `findFirstAvailableDate` returns the date without checking whether the override window excludes the bookable hours or has already passed today.

## When it activates

- **2026-01-11** — instructor `b7987…`, window 07:00–21:00
- **2026-03-02** — instructor `c9843…`, window 10:30–16:00

Zero affected rows before 2026-01-11.

## Standalone patch shape (if tripwire fires)

1. Extract `resolveDayWindows` from `src/lib/courseAvailability.ts` into `supabase/functions/_shared/dateOverrides.ts`.
2. Refactor `src/lib/courseAvailability.ts` to re-export from `_shared/`.
3. Replace the override short-circuit in `public-courses` with a call to the shared helper.

No Deno twin. Single source.

## Why deferred

Pulling `resolveDayWindows` into `_shared/` *is* P3 (every surface routes through canonical engine-owned logic). Doing it as a one-off this week, outside the precompute design, risks restructuring it again in P3. Deferral is correct as long as it has a deadline — this file is the deadline.

See `.lovable/plan.md` for full context.
