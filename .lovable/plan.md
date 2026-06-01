## What's going on

The Tax summary calculation itself is correct. The mileage figure is being blown up by a handful of corrupt `mileage_logs` rows.

For instructor `c9843b58…`, business mileage this UK tax year (Apr 6 2026 →) sums to **106,947 km ≈ 66,453 mi**, giving an HMRC deduction of ~£13,237. That's because of ~9 auto-logged trips on **2026-04-10** and **2026-04-14** with `distance_km` between **17,820 and 18,220** — i.e. ~18,000 km driven in a single 30-minute lesson. Clearly garbage.

Tracing the source:

```
lesson_telematics.total_distance_km  (18,000+ km on those sessions)
        │  trigger: public.auto_log_mileage()
        ▼
mileage_logs.distance_km             (same 18,000+ km)
        │  hook: useInstructorTaxSummary
        ▼
HMRC mileage deduction £13,237
```

So two real problems:
1. **Live data is poisoned** — `lesson_telematics` is occasionally recording huge phantom distances (likely a GPS jump or first-fix glitch since `started_at`→`ended_at` is only ~30 min). The `auto_log_mileage` trigger then copies that straight into `mileage_logs`.
2. **No sanity guard anywhere** — tax/expense surfaces accept any number, however absurd.

## Plan

### 1. Clean the corrupt rows (migration)
- Soft-delete-style fix: simply delete `mileage_logs` rows where `is_auto_logged = true` AND `distance_km > 500` (no plausible UK driving lesson covers 500 km). 15 rows match across the instructor in question; safe to do project-wide.
- Same scrub on the source: zero out `lesson_telematics.total_distance_km` where it exceeds 500 km, so the row stays for diagnostics but no longer feeds reports.

### 2. Guard the trigger
- Update `public.auto_log_mileage()` so the `INSERT` only fires when `NEW.total_distance_km` is between `0.1` and `500` km. Above that, log a `NOTICE` and skip — corrupt telemetry never reaches the tax engine again.

### 3. Defensive cap in the tax hook
- In `useInstructorTaxSummary`, ignore any individual `mileage_logs` row whose `distance_km` exceeds 500 km when summing `totalBusinessMiles`. Cheap belt-and-braces for any future bad data.

### 4. Out of scope (flag only)
- Diagnosing **why** `lesson_telematics.total_distance_km` occasionally records ~18,000 km is a separate telemetry bug (likely a single GPS sample jumping to a far-off coordinate before filtering). Worth a follow-up but outside this fix.
- No changes to Income or Expenses totals — those numbers are accurate.

## Files touched

- `supabase/migrations/<new>.sql` — delete bad `mileage_logs` rows, null out bad `lesson_telematics.total_distance_km`, replace `auto_log_mileage` with the bounded version.
- `src/hooks/useInstructorTaxSummary.ts` — filter rows where `distance_km > 500` before mileage sum.

## After the fix

Re-running the same query, the instructor's business mileage drops from 66k mi to a realistic value (a few hundred mi YTD), and the mileage allowance line on `/instructor/tax` should fall from £13,237 to something sensible.
