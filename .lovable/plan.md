

# Rork App Database Access Audit

## Critical Finding

**The Rork app will NOT be able to read data without authentication.** Almost every table the app needs is protected by RLS policies that require `auth.uid()` — meaning a logged-in user. The Rork app currently uses the anon key with a hardcoded instructor ID and no login, so all queries will return empty results or permission errors.

## Tables the Rork App Needs vs Current Access

| Table | Rork Needs | Anon Access? | Status |
|-------|-----------|-------------|--------|
| `instructors` | Dashboard profile | Yes (active only) | OK |
| `instructor_working_hours` | Schedule display | Yes (public) | OK |
| `scheduled_lessons` | Diary/schedule | No — requires `authenticated` | BLOCKED |
| `pupils` | Pupil list, names | No — requires `authenticated` | BLOCKED |
| `payment_history` | Earnings, finance | No — requires `authenticated` | BLOCKED |
| `instructor_expenses` | Expense tracking | No — requires `authenticated` | BLOCKED |
| `mileage_logs` | Mileage tracking | No — requires `authenticated` | BLOCKED |
| `lesson_telematics` | GPS sessions | No — requires `auth.uid()` match | BLOCKED |
| `telematics_gps_points` | Route maps | No — requires `auth.uid()` match | BLOCKED |
| `telematics_alerts` | Driving alerts | No — requires `auth.uid()` match | BLOCKED |
| `clock_entries` | Clock in/out | No — requires `authenticated` | BLOCKED |
| `live_pupil_positions` | Live map | No — requires `auth.uid()` match | BLOCKED |
| `instructor_todos` | Todo list | No — requires `auth.uid()` match | BLOCKED |

**Only 2 out of 13 key tables are accessible without login.**

## What This Means

When you run the Rork app with Phases 1-3, you will see:
- The instructor's public profile (name, photo) — works
- Working hours — works
- **Everything else will be empty** — no lessons, no pupils, no payments, no tracking data

## Recommended Fix

**Option A — Implement Phase 4 (Authentication) First**
Add login to the Rork app so the user authenticates as the instructor. Once logged in, `auth.uid()` is set and all RLS policies work automatically. This is the secure, correct approach.

**Option B — Add Temporary Anon Read Policies (Quick Test Only)**
Add temporary SELECT policies on key tables allowing anon read filtered by `instructor_id`. This lets you test the UI immediately but is a security risk and must be removed before production.

Example temporary policy:
```sql
CREATE POLICY "temp_anon_read" ON scheduled_lessons
FOR SELECT TO anon USING (
  instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid
);
```
This would need to be added to ~11 tables and removed later.

## Implementation Plan

If Option B (temporary test policies) is chosen, I would:

1. Add temporary anon SELECT policies on all 11 blocked tables, scoped to the hardcoded instructor ID only
2. Test that data flows through correctly
3. Remove all temporary policies when Phase 4 (auth) is implemented

If Option A is chosen, I would generate the Phase 4 authentication prompt for Rork immediately.

