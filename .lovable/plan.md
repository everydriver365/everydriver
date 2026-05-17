# Pupil Portal → Real Supabase Auth

Replace the custom `pupil_credentials` + sessionStorage flow with proper Supabase Auth sessions. This fixes the login loop at its root: once a pupil signs in, `auth.uid()` is set, RLS works normally, and `BrandedPupilPortal` can read its own pupil row without any service-role round-trips.

## What changes

### 1. Database
- Add `pupils.auth_user_id uuid UNIQUE` referencing `auth.users(id)` (nullable so existing pupils can backfill on next login).
- Index on `auth_user_id` for fast portal lookups.
- New RLS policy: pupils can `SELECT` / `UPDATE` their own row where `auth_user_id = auth.uid()`. Existing instructor policies untouched.
- Add matching "self-read" policies for the small set of pupil-portal tables that currently rely on sessionStorage-pupil-id fetches (e.g. `payment_history`, `scheduled_lessons` for the pupil's own rows). Scope kept tight — read-only, own rows only.

### 2. `pupil-email-auth` edge function
Becomes a thin "ensure auth user exists, then let the client sign in" layer:
- **login**: find pupil by email → if `auth_user_id` is null, create auth user via `supabase.auth.admin.createUser({ email, password, email_confirm: true })` and link it on the pupil row. If it already exists, call `admin.updateUserById` to (re)set the password to what the user just typed only on first migration; otherwise leave password alone and let the client verify. Return `{ success, email }` — no more `pupilId` payload needed.
- **register**: same path — create the pupil row if needed, create the auth user, link, return success.
- **forgot_password / confirm_reset**: keep the existing 6-digit OTP-by-email flow, but instead of writing to `pupil_credentials`, call `admin.updateUserById({ password })` on the linked auth user. `pupil_credentials` is retired.

### 3. `PupilLogin.tsx` / `PupilRegister.tsx`
After the edge function returns success, call `supabase.auth.signInWithPassword({ email, password })` on the client. On success, navigate to `/p/:slug`. Remove all `sessionStorage.setItem("pupil_*", ...)` writes.

### 4. `BrandedPupilPortal.tsx`
- Adopt the `useAuthReady` pattern (wait for `getSession()` before querying).
- Replace the sessionStorage lookup + service-role fallback with: `supabase.from("pupils").select(...).eq("auth_user_id", user.id).maybeSingle()`.
- Logout button calls `supabase.auth.signOut()`.

### 5. Migration of existing pupils
Lazy: any pupil who previously set a password via the old flow will, on their next login, hit the "no `auth_user_id` yet" branch — we create their auth user with the password they just typed and link it. No bulk migration script needed. (`pupil_credentials` rows can be dropped later once `auth_user_id` is populated everywhere.)

## Technical notes
- Auth signups should NOT be disabled globally — the edge function uses the service role's `auth.admin.createUser`, which works regardless. We won't expose `supabase.auth.signUp` to pupils.
- Email confirm is set to `true` server-side so pupils don't need to click a verification link.
- The `instructors` table grant we added last turn stays — anonymous visitors still need to read branding before signing in.
- RLS policies are tightened, not loosened: the previous "anon can read pupils" hole stays closed; pupils only see their own row.

## Verification
1. Log in as `lrsp@dufosse.co.uk` / `Topsydog1&` at `/p/ken-d`.
2. Confirm: edge call returns success → `signInWithPassword` succeeds → portal loads Dave Kebab's data with no loop and no 406 on `/rest/v1/pupils`.
3. Reload the page → still logged in (real session persists).
4. Logout → returns to login screen, no stale sessionStorage.
