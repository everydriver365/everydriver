## Problem

On the published site you press **Log in** and the form just sits there / resets — you never reach a portal. The Supabase auth logs show the sign-in actually **succeeds** (200 on `/token`), so the credentials and backend are fine. The failure is happening **after** sign-in, on the client.

## Likely root cause

In `src/pages/UnifiedLogin.tsx` there's a name collision:

```ts
import { setRememberMe } from "@/lib/sessionPersistence";   // helper
...
const [rememberMe, setRememberMe] = useState(false);        // ← shadows the import
...
setRememberMe(rememberMe);  // calls the React state setter, NOT the persistence helper
navigate("/auth/redirect", { replace: true });
```

Two consequences:

1. The persistence helper never runs, so the "Remember me" preference isn't stored. `enforceRememberMeOnBoot()` then runs on the next page and, if the in-tab `sessionStorage` sentinel isn't seen (which can happen on the published custom domain because of cross-host nav from `everydriver.co.uk` ↔ Lovable origins, hard reload, or a wrapped app context), calls `supabase.auth.signOut({scope:"local"})`, wiping the session you just created. Result: you land on `/auth/redirect`, `getUser()` returns null, and `RoleRedirect` bounces you back to `/`.
2. Even when it doesn't sign you out, the spinner state can read stale because the setter is being mis-used.

The dev preview "works" because the iframe keeps the sentinel alive across the same tab/session, masking the bug.

## Fix

1. **Rename the local state** in `UnifiedLogin.tsx` so it stops shadowing the import:
   - `useState(false)` → `[rememberChecked, setRememberChecked]`
   - Toggle handler and switch markup updated to the new names
   - Call the imported `setRememberMe(rememberChecked)` **before** navigating

2. **Persist *before* navigate** (and `await` nothing that could race): same line, just with the right function bound.

3. **Add a one-shot diagnostic log** (kept lightweight, wrapped in `try/catch`) inside the login `handleLogin` and at the top of `RoleRedirect` so that if anything else is wrong on your custom domain we can see it in the published console without another round-trip:
   - log whether `signInWithPassword` returned a session
   - log whether `getUser()` resolves to a user on `/auth/redirect`

4. **No other files changed.** The route table, `RoleRedirect`, and `enforceRememberMeOnBoot` logic are correct — only `UnifiedLogin.tsx` is buggy.

## Verification

After publishing the fix:
- Hard refresh `everydriver.co.uk/login`, log in with your credentials
- Expected: you land on `/instructor` (your account's primary role) within ~1s
- If it still fails, the new console probes will tell us exactly which step (sign-in, getUser, user_roles query) is failing and I'll address that next.

## Out of scope

- No design changes to the login page
- No changes to other login pages (`Drive365Login`, `InstructorPortalLogin`, `AdminLogin`) — they don't have this shadow bug
- No backend / RLS changes