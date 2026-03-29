

# Fix Rork Data Access — Add Missing Anon RLS Policies

## Problem
Rork uses the anon key with no authenticated session. Temporary anon SELECT policies were added for 11 core tables, but several important tables are still missing policies — particularly the Geotab tables and GPS devices. Edge Functions also reject Rork's requests because they validate JWTs.

## What Will Be Done

### 1. Add temporary anon SELECT policies for missing tables

These tables need `temp_rork_anon_read` policies scoped to the hardcoded instructor ID:

| Table | Filter Column |
|-------|--------------|
| `gps_devices` | `instructor_id` |
| `geotab_driver_events` | `instructor_id` |
| `geotab_fuel_usage` | `instructor_id` |
| `geotab_impact_events` | `instructor_id` |
| `geotab_fault_codes` | `instructor_id` |
| `conversations` | `instructor_id` |
| `messages` | via conversation subquery |

All policies use `FOR SELECT TO anon USING (instructor_id = 'b7987d5e-...')`.

### 2. Add anon write policies for Rork interactions

For tables Rork needs to write to (e.g. acknowledging impacts, updating push tokens):

| Table | Operation | Filter |
|-------|-----------|--------|
| `geotab_impact_events` | UPDATE | `instructor_id` match |
| `gps_devices` | UPDATE | `instructor_id` match |

### 3. Create anon-accessible Edge Function wrappers

The existing Edge Functions (`geotab-trips`, `geotab-fault-data`, `geotab-status-data`) validate JWTs and reject anon calls. Two options:

**Option chosen:** Add a new Edge Function `rork-geotab-proxy` that:
- Accepts the hardcoded instructor ID in the request body
- Validates it matches the known instructor ID (no arbitrary access)
- Uses the service role key internally to call the database
- Calls the Geotab API directly (same logic as existing functions)
- Returns data to Rork without requiring JWT auth

This avoids modifying the secure existing Edge Functions.

### 4. Security notes

- All policies are scoped to one instructor ID only — no broad anon access
- These are **temporary** until Phase 4 (authentication) is implemented in Rork
- The proxy Edge Function only serves the hardcoded instructor, rejecting other IDs

## Technical Details

**Migration SQL** will include ~7 new `CREATE POLICY` statements.

**New Edge Function** `supabase/functions/rork-geotab-proxy/index.ts` — a single function that accepts an `action` parameter (`trips`, `faults`, `status`) and proxies to Geotab using the same logic as existing functions, but without JWT validation.

