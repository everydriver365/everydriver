

## Consolidate to Single Google Service Account

### Problem
You currently have **two separate** Google Calendar systems running in parallel:
1. **OAuth flow** — each instructor connects their own Google account (complex, requires Google verification, unverified app warnings)
2. **Service account flow** — one Google account manages everything (simple, no per-user auth needed)

### Solution
Keep **only the service account approach**. One Google account, one set of credentials. Instructors just share their Google Calendar with the service account email — done.

### What stays
- `google-calendar-service` edge function — already handles read busy times (events.list) and write events (create/update/delete)
- `instructor_google_service_calendar` table — stores each instructor's calendar ID
- `instructor_calendar_events` table — stores synced busy times
- `GoogleServiceAccountSetup` component — already has the UI for entering calendar ID and testing connection

### What changes

**1. Update `process-calendar-queue` to use service account**
Currently this function uses OAuth tokens (`instructor_calendar_tokens`). Change it to look up the instructor's calendar ID from `instructor_google_service_calendar` and authenticate via the service account JWT (using `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`), same pattern as `google-calendar-service`.

**2. Update `scheduled-calendar-sync` to use service account**
Same change — iterate over `instructor_google_service_calendar` rows instead of `instructor_calendar_tokens`, use service account JWT for auth.

**3. Replace `CalendarConnect` with `GoogleServiceAccountSetup`**
- In `InstructorSettings.tsx` and `InstructorForm.tsx`, swap `CalendarConnect` for `GoogleServiceAccountSetup`
- Remove imports of `CalendarConnect`, `useGoogleOAuth`, `useGoogleCalendarSync`

**4. Remove OAuth-only files**
- Delete `supabase/functions/google-oauth/index.ts`
- Delete `supabase/functions/calendar-sync/index.ts`
- Delete `src/hooks/useGoogleOAuth.ts`
- Delete `src/hooks/useGoogleCalendarSync.ts`
- Delete `src/components/instructor/CalendarConnect.tsx`
- Delete `src/pages/CalendarCallback.tsx`
- Remove `/calendar-callback` route from router

**5. Clean up secrets**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are no longer needed (service account uses `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` which are already set)

### How it works for instructors
1. Admin or instructor goes to settings → Google Calendar section
2. Sees the service account email (e.g. `calendar@everydriver.iam.gserviceaccount.com`)
3. Copies it, goes to Google Calendar settings, shares their calendar with that email (give "Make changes to events" permission)
4. Pastes their Calendar ID (found in Google Calendar settings → Integrate calendar)
5. Clicks "Test & Connect" — done

### Files to modify
- `supabase/functions/process-calendar-queue/index.ts` — switch from OAuth to service account auth
- `supabase/functions/scheduled-calendar-sync/index.ts` — switch from OAuth to service account auth
- `src/pages/InstructorSettings.tsx` — swap CalendarConnect → GoogleServiceAccountSetup
- `src/components/admin/InstructorForm.tsx` — swap CalendarConnect → GoogleServiceAccountSetup
- Router config — remove `/calendar-callback` route

### Files to delete
- `supabase/functions/google-oauth/index.ts`
- `supabase/functions/calendar-sync/index.ts`
- `src/hooks/useGoogleOAuth.ts`
- `src/hooks/useGoogleCalendarSync.ts`
- `src/components/instructor/CalendarConnect.tsx`
- `src/pages/CalendarCallback.tsx`

### Google setup (your new account)
1. Create Google Cloud project, enable Calendar API
2. Create a **Service Account** (not OAuth client)
3. Download the JSON key file
4. Update secrets: `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` with the new values
5. No OAuth consent screen, no verification, no redirect URIs needed

