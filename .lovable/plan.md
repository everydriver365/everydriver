## What I found

- Kenneth’s password login is accepted by the backend.
- His account is linked to an instructor profile: **Ken D**.
- The profile email is **info@drive365.co.uk**, but it is linked to the login account ID for **kenneth@dufosse.co.uk**, so the email mismatch is not the blocker.
- The likely failure is in the app after login: the login screen waits for an auth state event to load the instructor profile and redirect to `/instructor`. If that event is delayed or missed, the button can stay spinning or the user remains on `/instructor-app/login` even though authentication succeeded.

## Plan

1. **Make sign-in deterministic**
   - After `signInWithPassword` succeeds, immediately set the local session/user state inside `InstructorAuthContext`.
   - Immediately load the linked instructor profile using the returned auth user ID instead of relying only on `onAuthStateChange`.

2. **Redirect only after profile lookup completes**
   - If a linked instructor profile is found, redirect to `/instructor`.
   - If no instructor profile is found, show a clear account-linking message instead of spinning.

3. **Add a safety timeout around profile loading**
   - If the instructor profile query hangs, stop the spinner and show a retry/error message.
   - Do not silently leave the login form in `Signing in…` state.

4. **Keep sign-out/session fixes intact**
   - Preserve the recent local sign-out hardening.
   - Avoid changing mobile layout or unrelated auth flows.

## Technical details

- Update `src/context/InstructorAuthContext.tsx` so successful `signIn()` calls `setSession`, `setUser`, and `fetchInstructorProfile(authUserId)` directly.
- Make `fetchInstructorProfile` return whether a profile was found, so login can resolve cleanly.
- Keep the auth listener for page refreshes and sign-out, but stop using it as the only post-login redirect path.