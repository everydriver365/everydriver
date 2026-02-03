
Goal: make “Test Connection” reliably update your device/instructor status instead of returning “0 devices updated” and staying Offline.

What the logs/data show right now (root cause)
- The backend function is successfully reaching GPSgate:
  - It returns `total_users: 5` from GPSgate (so credentials + app ID are at least valid).
- But it cannot match your saved instructor setting to any GPSgate “user/asset”:
  - Log: `Instructor ... username e0f96ee7-... not found in GPSgate users`
  - Your database row confirms this is what’s stored:
    - `instructors.gpsgate_username = "e0f96ee7-0ec6-4e0b-907f-36b663f32517"`
    - `instructors.gpsgate_user_id = null`
- It also cannot match your registered device to any GPSgate user:
  - Device in DB: `device_identifier = 7018524391`, `device_name = "My Phone"`, `gpsgate_user_id = null`
  - Log: `Device 7018524391 not linked in GPSgate (no_match). Candidates tried: 7018524391, My Phone`

So the system is working, but it’s missing a reliable “picker/lookup” to link your instructor/device to the correct GPSgate entity (numeric user ID).

High-level fix
1) Make instructor auto-linking smarter (match against GPSgate Username OR Name OR Description, not just exact Username).
2) Add a small “Lookup” helper in Settings so you can search GPSgate and select the correct tracker, and we store the numeric `gpsgate_user_id` automatically.
3) (Optional but recommended) Improve the “Test Connection” result message so it tells you whether it updated a device, updated an instructor, or found no tracks for today.

Planned code changes

A) Backend function: improve instructor matching in `gpsgate-poller`
File: `supabase/functions/gpsgate-poller/index.ts`

Change:
- Replace the current instructor username → ID mapping logic that only does:
  - `usernameToUserId.get(normalizedUsername)`
- With a call to the existing helper already in this file:
  - `resolveGpsGateUserIdForDevice(...)`
  - That helper already supports:
    - exact username match
    - digit-based match
    - substring match across Username / Name / Description

Result:
- If you type something like “Tracker iOS” (which might be the GPSgate Name) it can still resolve the correct numeric user ID.
- If it resolves a user ID, it will persist it back into `instructors.gpsgate_user_id` (as intended), so future polling is fast and stable.

B) Add a dedicated “GPSgate user lookup” backend function (so the UI can show you the right tracker)
New backend function (name suggestion): `gpsgate-user-lookup`
Purpose:
- When you click a button in Settings, it fetches the GPSgate users list and returns matching candidates so you can pick one.

Behavior:
- Requires you to be logged in (validate the Authorization header inside the function, following existing patterns in `supabase/functions/google-oauth/index.ts` / `calendar-sync/index.ts`).
- Input: `{ query: string }`
- Output: a small list (max ~20) of candidates:
  - `{ id: number, username: string, name: string, description: string }`
- Matching rules:
  - case-insensitive substring match on Username / Name / Description
  - digit-only matching for identifiers like IMEI/phone-number patterns

Why this is needed:
- Right now, if your GPSgate UI shows identifiers that don’t exactly equal the API’s `Username`, you have no way to know what the backend expects.
- This makes linking “self-service”: you search, pick, we store the correct numeric ID.

C) Update the instructor Settings UI to auto-fill the numeric ID
File: `src/components/instructor/InstructorDetailsEditor.tsx`

Additions in the GPS section:
- Add a button: “Find tracker”
  - Calls `gpsgate-user-lookup` with whatever you typed into “GPSgate Username”
  - If exactly 1 match:
    - auto-fill `gpsgate_user_id` in the form
    - optionally replace the text field with the matched GPSgate `Username` for consistency
    - show a success toast like “Linked to GPSgate user #123 (Tracker iOS)”
  - If multiple matches:
    - show a small selection list (Radix Select or a simple list of buttons)
    - user chooses, then we fill `gpsgate_user_id`
  - If 0 matches:
    - show a clear error: “No matching tracker found in GPSgate for this application. Check you’re looking at the same GPSgate application as the configured App ID.”

Also improve “Test Connection” toast:
- Instead of only `processed` (devices), include instructor processing too:
  - e.g. “Poll complete: 0 devices updated, 1 instructor updated” (once working)
  - This avoids confusion because right now the UI says “0 devices updated” even though instructor-updates are a separate pathway.

D) (Optional) Make instructor tracking work even if no device row exists
File: `supabase/functions/gpsgate-poller/index.ts`

Currently:
- If the instructor has GPSgate data but there is no `traccar_devices` row, it logs:
  - “creating virtual entry”
- But it does not actually insert one.

Change:
- If `.update(...).eq("instructor_id", instructor.id)` affects 0 rows, insert a minimal “virtual device” row so the UI connection status can work for instructors who didn’t register a device yet.

Testing / verification steps (end-to-end)
1) Go to Instructor Settings → GPS.
2) Enter something you recognize (e.g. “Tracker iOS”) and click “Find tracker”.
3) Select the correct tracker; confirm the numeric “GPSgate User ID” field is filled.
4) Click “Save GPS Settings”.
5) Click “Test Connection”.
6) Confirm:
   - Poll response shows at least 1 instructor updated (or 1 device updated if you’re using device mapping).
   - Connection Status changes to Connected once `last_seen_at` is updated with a recent GPS timestamp.

Edge cases handled
- If GPSgate returns users but none match your query, we’ll clearly indicate it’s likely the wrong GPSgate application (App ID mismatch) or you’re viewing a different entity list in GPSgate than the API’s `/users` endpoint.
- If tracks are empty for “today”, we can optionally also try “yesterday” as a fallback (timezone/day-boundary safety) so first-time setup is less confusing.

Scope note
- This plan does not change your database schema; it uses existing columns:
  - `instructors.gpsgate_username`, `instructors.gpsgate_user_id`
  - `traccar_devices.gpsgate_user_id`, `traccar_devices.last_seen_at`, etc.
