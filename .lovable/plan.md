

## Plan: Fix Offline Sync + Radius Token Errors

### Issue 1: Offline sync queries wrong column names

**File**: `src/hooks/useOfflineSync.ts`

The `pupils` table has a `name` column, not `first_name` / `last_name`. Two queries need fixing:

- **Line 236**: Change `pupil:pupils(id, first_name, last_name, phone, address, postcode)` to `pupil:pupils(id, name, phone, postcode)`
- **Line 262**: Change `'id, first_name, last_name, phone, address, postcode, status, experience_level'` to `'id, name, phone, postcode, status, experience_level'`

### Issue 2: Radius poller missing API token

The `radius-poller` edge function requires a `RADIUS_API_TOKEN` secret. Either:
- Add the secret if you have a Radius account
- Or suppress the error by not calling the poller when no token is configured

Since not all instructors use Radius, the poller should gracefully skip when the token is missing rather than returning a 500 error.

### Files changed

| File | Change |
|------|--------|
| `src/hooks/useOfflineSync.ts` | Fix column names from `first_name`/`last_name` to `name` |
| `supabase/functions/radius-poller/index.ts` | Return early with 200 + message instead of 500 when token missing |

