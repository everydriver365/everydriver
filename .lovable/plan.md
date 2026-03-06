

## Calendar Sync Status: Mostly Correct, Some Cleanup Needed

### What's Working Well
- **Service account auth** is solid — robust key parsing handles JSON blobs, escaped newlines, padding
- **2-way sync**: External events imported via `fetchExternalEvents`, lessons pushed via `process-calendar-queue`
- **Per-instructor isolation**: Each instructor's calendar ID stored separately in `instructor_google_service_calendar`
- **Pagination**: Both sync paths handle Google's `nextPageToken` correctly
- **Error recording**: Sync errors stored per-instructor for debugging
- **Queue cleanup**: Old processed items cleaned up after 7 days

### Issues to Fix

**1. Duplicate/stale cron jobs (4 jobs, should be 2)**

| Job ID | Schedule | Target | Status |
|--------|----------|--------|--------|
| 3 | `*/15 * * * *` | `scheduled-calendar-sync` | **REDUNDANT** — old function, duplicates job 14 |
| 14 | `*/15 * * * *` | `google-calendar-service` (syncAllInstructors) | ✅ Keep |
| 5 | `* * * * *` | `process-calendar-queue` | **OLD** — runs every minute, wasteful |
| 15 | `*/15 * * * *` | `process-calendar-queue` | ✅ Keep |

**Fix**: Remove jobs 3 and 5. They're leftover from the old setup.

**2. Redundant edge functions still exist**

Per the consolidation plan, these old OAuth-based files should be deleted:
- `supabase/functions/scheduled-calendar-sync/index.ts` — superseded by `syncAllInstructors` action in `google-calendar-service`
- `supabase/functions/sync-all-calendars/index.ts` — also redundant
- Any remaining OAuth files (`google-oauth`, `calendar-sync`, `CalendarConnect`, `useGoogleOAuth`, `useGoogleCalendarSync`, `CalendarCallback`)

**3. `generateJWT` signature mismatch**

In `google-calendar-service/index.ts`, `generateJWT` accepts 3 params (`serviceEmail, privateKey, calendarId`) but `calendarId` is never used inside the function. The `process-calendar-queue` version only takes 2 params. This is harmless but messy — should standardize to 2 params.

### Plan

1. **Remove stale cron jobs** (IDs 3 and 5) via SQL
2. **Delete redundant edge functions**: `scheduled-calendar-sync`, `sync-all-calendars`
3. **Fix `generateJWT` signature** in `google-calendar-service` — remove unused `calendarId` parameter and update all call sites
4. **Delete old OAuth files** if they still exist (per the consolidation plan)

### Technical Details

- SQL to remove stale jobs: `SELECT cron.unschedule(3); SELECT cron.unschedule(5);`
- The `process-calendar-queue` function correctly uses service account auth and looks up `instructor_google_service_calendar` — no changes needed there
- The delete-then-upsert pattern in `fetchExternalEvents` (line 602-624) could theoretically cause a brief window with no events, but for a 15-min sync this is acceptable

