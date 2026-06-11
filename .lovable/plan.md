## Problem

On `everydriver.co.uk` (and any non-instructor host) signing in succeeds — Supabase returns a valid session — but `ConditionalHome` always renders the learner marketing page on `/` regardless of auth state. There is no automatic hop into `/auth/redirect`, so an instructor like Kenneth ends up back on the public homepage and assumes login is broken.

Auth logs and network traffic confirm:
- `POST /token` (login) → 200 for `kenneth@dufosse.co.uk`
- `POST /token?grant_type=refresh_token` → 200 with a fresh access token
- The page rendered is the EveryDriver marketing homepage, not the instructor portal

## Fix

Add a one-shot session check to `ConditionalHome` that runs before the marketing variants render. If the user already has a Supabase session, redirect them through `/auth/redirect` so `RoleRedirect` sends them to the correct portal (instructor, pupil, admin, school, etc.).

### File: `src/components/ConditionalHome.tsx`

1. Import `useEffect`, `useState`, `supabase`, and reuse the existing spinner pattern.
2. At the top of the component, run `supabase.auth.getSession()` once. While resolving, render the existing centered spinner (max ~1.5s timeout so anonymous users don't see a flash).
3. If a session exists AND the current path is `/` (root), `<Navigate to="/auth/redirect" replace />`. This guarantees authed users land in their portal whether they hit `everydriver.co.uk`, a Drive365 host, a whitelabel host, or the lovable preview.
4. If no session OR timeout fires, fall through to the existing variant logic unchanged (instructor variant still uses `AppEntryRedirect`, mini-website subdomains still render their public page, etc.).

### Out of scope

- No changes to `UnifiedLogin`, `RoleRedirect`, `AppEntryRedirect`, or any login form.
- No DB changes. No mobile-layout changes.
- Mini-website subdomains (`isInstructorSubdomain()`) remain a public marketing surface — the redirect is only applied at the root of the marketing/EveryDriver/Drive365/whitelabel hosts where users would otherwise be stranded.

## Result

After signing in on `everydriver.co.uk` (or returning to it with a live session), instructors land on `/instructor`, pupils on `/pupil` (or `/p/:slug`), admins on `/admin`, etc., instead of being dumped back on the learner marketing page.