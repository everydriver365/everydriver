## Goal

Replace the seed/in-memory state on the Availability page with real backend persistence. Edits to weekly hours, time off and booking rules are autosaved (debounced) and rehydrate correctly on refresh.

## Backend changes (one migration)

Tables already exist; add a few columns and use them as the source of truth.

1. `availability_windows` — already has `instructor_id, day_of_week (int), start_time, end_time, is_active, label`. We will use `day_of_week` with ISO convention `1=Mon … 7=Sun` and treat the absence of any active row for a day as "day off". RLS already exists for instructor self-access (verify and add if missing).

2. `availability_rules` — add columns to support the Time-off card:
   - `title text`
   - `category text` (`holiday | training | bank-holiday | personal | sick | other`)
   - `notes text`
   - `is_recurring boolean default false`
   - `is_auto boolean default false`
   We persist time-off entries as rows with `rule_type='holiday_block'`, `is_available=false`, `start_date`, `end_date`. Add RLS policies if missing (instructor self-access via `get_instructor_id_for_user(auth.uid())`).

3. `instructors` — add the missing booking-rule columns (use existing where possible):
   - reuse `buffer_minutes` for travel buffer
   - reuse `booking_advance_days` for booking horizon (store as days = weeks*7)
   - add `min_lead_hours int default 24`
   - add `slot_increment_minutes int default 30`
   - add `allow_same_day_booking boolean default false`
   - add `auto_block_bank_holidays boolean default true`

## Frontend changes — `src/pages/instructor-app/InstructorAvailabilityDesktop.tsx`

1. Add a `useAvailabilityData(instructorId)` hook (new file `src/hooks/useAvailabilityData.ts`) that:
   - Fetches `availability_windows`, `availability_rules` (where `rule_type='holiday_block'`), and the booking-rule columns from `instructors` in parallel via React Query.
   - Maps DB rows into the component's `WeeklyHours`, `TimeOff[]`, `BookingRules` shapes (and back).

2. Replace `useState(seed*)` initial values with the loaded data. Show a light skeleton (or `null`) until the first fetch resolves so we don't flash seed data and immediately overwrite the DB.

3. Replace the fake `setSaveState("saved")` debounce with a real save pipeline:
   - One debounced effect (600 ms) per slice (`weekly`, `timeOff`, `rules`) — each compares against the last-saved snapshot and only fires when it actually changed.
   - **Weekly hours**: diff per day. For days that changed, run a single transaction-style upsert: delete existing rows for that `(instructor_id, day_of_week)` and insert the current windows (`is_active=true`). For disabled days, just delete the rows. Done via two awaited Supabase calls per changed day.
   - **Time off**: track `id` per item (use real UUIDs from DB after insert). On add → insert; on update → update by id; on delete → delete by id. The `onAdd/onUpdate/onDelete` callbacks become async and update local state from the returned row.
   - **Booking rules**: single `update` on `instructors` with the mapped columns (`booking_advance_days = horizonWeeks*7`, etc.).
   - On any failure set `saveState='error'` and surface a toast with retry; on success set `'saved'`.

4. Keep the existing UI exactly as-is (toggles, drag timeline, sheet, preview). The "All changes saved / Saving / Couldn't save" indicator becomes truthful instead of cosmetic.

5. Invalidate the React Query cache after each successful save so any other surfaces (e.g. `AvailabilityWindowsManager`) stay in sync.

## Out of scope

- No mobile changes (per project memory: do not alter mobile layouts unless explicitly asked).
- No realtime subscription — rehydration on refresh is the requirement; we can add realtime later.
- Bank-holiday auto-population stays a flag only; actually inserting holiday rows can be a follow-up.

## Files touched

- New: `supabase/migrations/<timestamp>_availability_persistence.sql`
- New: `src/hooks/useAvailabilityData.ts`
- Edit: `src/pages/instructor-app/InstructorAvailabilityDesktop.tsx`
