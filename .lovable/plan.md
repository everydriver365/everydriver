## Goal

The entry route (`/` and `/index`) should send users straight to the **DSM instructor login** when they're using the instructor app, and to the **pupil login** when they're using the pupil app — instead of the current marketing/landing page.

## How "instructor app" vs "pupil app" is detected

The codebase has no app-variant flag — both run from the same web bundle. The reliable signal is hostname (already used everywhere):

- **Instructor app** = `isEveryDriverHost()` is true (everydriver.co, everydriver.co.uk, everydriver.lovable.app, plus the native Capacitor app which points at the Lovable preview URL).
- **Pupil app** = `isDrive365Domain()` is true, `isWhitelabelDomain()` is true (e.g. winchesterdrivingschool.co.uk), or `isInstructorSubdomain()` is true (mini-website learner flow).

For the native Capacitor build, the current `capacitor.config.ts` points at the project preview URL, which means hostname can't tell instructor vs pupil. To handle this we'll add a **persisted "last app" hint** (`localStorage.lovable_app_variant = "instructor" | "pupil"`) that is set whenever the user visits an `/instructor*` route or a `/pupil*`/`/login` route. On a cold native open we use that hint to choose the right login.

## The change

1. **New helper `src/lib/appVariant.ts`** with:
   - `getAppVariant(): "instructor" | "pupil" | "marketing"` — returns:
     - `"instructor"` if `isEveryDriverHost()` is true, or current path starts with `/instructor`, or persisted hint is `"instructor"`.
     - `"pupil"` if `isDrive365Domain()`, `isWhitelabelDomain()`, `isInstructorSubdomain()`, current path starts with `/pupil`/`/login`/`/booking`, or persisted hint is `"pupil"`.
     - `"marketing"` otherwise (e.g. lovable.app preview with no hint yet — keeps current behaviour).
   - `rememberAppVariant(variant)` — writes to localStorage.

2. **Persist the hint** with a tiny effect inside `ConditionalHome` (and once in `InstructorPortalLayout`) so the moment a user actually lands on `/instructor*` or `/login` we remember it for next launch.

3. **Update `ConditionalHome`** (the element bound to `/` and `/index`):
   - If `getAppVariant() === "instructor"`:
     - If already authenticated as an instructor → `<Navigate to="/instructor" replace />`.
     - Else → `<Navigate to="/instructor-app/login" replace />`.
   - If `getAppVariant() === "pupil"`:
     - If already authenticated as a pupil → `<Navigate to="/pupil" replace />` (or wherever the post-login destination is).
     - Else → `<Navigate to="/login" replace />`.
   - If `"marketing"` → keep the existing behaviour (renders `HomepageRedesignDemo`, EveryDriver Index, etc).

4. **Auth checks** reuse the existing contexts (`useInstructorAuth`, and the pupil session via `supabase.auth.getSession()` — there's no dedicated pupil context). To keep things synchronous in render, do the session check inside a tiny wrapper component that shows a brief spinner until the session resolves, then navigates.

5. **No changes** to login pages themselves, to the `/instructor` portal layout, or to route definitions besides `ConditionalHome`.

## Files touched

- **new** `src/lib/appVariant.ts`
- `src/components/ConditionalHome.tsx` — variant-based redirect
- `src/components/layout/InstructorPortalLayout.tsx` — one `useEffect` to call `rememberAppVariant("instructor")`
- `src/pages/login/UnifiedLogin.tsx` (or wherever the pupil login lives) — one `useEffect` to call `rememberAppVariant("pupil")`

## Confirm before I build

- For the **pupil app authenticated landing**, is it `/pupil` or a different route? (I'll default to `/pupil` if you don't say.)
- For the **native Capacitor app**, do you ship a single build for both apps (current setup), or are there separate iOS/Android builds for instructor vs pupil? If separate, we can hardcode the variant per build via a Vite env var (`VITE_APP_VARIANT`) and skip the localStorage hint — cleaner. Say which and I'll implement accordingly.
