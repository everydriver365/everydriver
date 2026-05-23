## Goal
Replace the mislabelled / hard-coded zeros on the **Calls** and **Enquiries** dashboard tiles with real counts from the database, so they reflect actual missed phone calls and new pupil enquiries.

## Problems to fix

1. `MobileHomeDSM2026.tsx` (lines 247–252) — `attention.calls` is wired to **visitor web-chat** unread count, and `attention.enquiries` is wired to **unread pupil messages**. Both are wrong sources.
2. `MobileHomeRedesign.tsx` (lines 1821, 1836) — both `missedCallsCount` and `enquiriesCount` are hard-coded `0`. This violates the LIVE DATA ONLY core rule.

## Changes

### 1. New hook: `src/hooks/useMissedCallsCount.ts`
- Queries `famulor_call_logs` for the signed-in instructor
- Filters: `direction = 'inbound'`, `status IN ('missed','no-answer','failed','busy')`, `created_at >= now() - interval '7 days'`
- Returns `{ data: number }` via `useQuery`, key `["missed-calls-count", instructorId]`, 60s staleTime

### 2. New hook: `src/hooks/useNewEnquiriesCount.ts`
- Queries `booking_enquiries` filtered by `assigned_instructor_id = instructorId AND status = 'new'`
- Also unions `course_enquiries` where `instructor_id = instructorId AND status = 'new'` (the Jobs tile only counts `pending`; brand-new "enquiry" stage is separate)
- Returns `{ data: number }`, key `["new-enquiries-count", instructorId]`, 60s staleTime

### 3. Re-wire `MobileHomeDSM2026.tsx`
- Import the two new hooks
- Replace `attention.calls = visitorChatCount` with the missed-calls count
- Replace `attention.enquiries = msgsCount` with the new-enquiries count
- Update `attention.total` and `todoCount` arithmetic to use the new sources
- Keep `visitorChatCount` and `msgsCount` available — they're still rendered elsewhere (Messages section), just no longer mislabelled

### 4. Re-wire `MobileHomeRedesign.tsx`
- Import the two new hooks
- Replace `const missedCallsCount: number = 0` → `const { data: missedCallsCount = 0 } = useMissedCallsCount(instructorId)`
- Replace `const enquiriesCount: number = 0` → `const { data: enquiriesCount = 0 } = useNewEnquiriesCount(instructorId)`
- Remove the "to be wired later" comment

## Out of scope
- No schema changes — both tables already exist with the needed columns
- No new RLS policies — existing instructor-scoped policies cover these reads
- No UI/visual changes to the tiles themselves
- Don't touch desktop dashboards or `ActivityTilesGrid` (Jobs/Tests/Messages there are already live and correctly sourced)

## Verification
- Confirm tiles show real counts in preview; subtitles update ("3 missed calls", "2 new enquiries") when DB rows match the filters
- Confirm counts return to 0 cleanly when no rows match (no `||` fallbacks hiding errors)
