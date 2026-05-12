## What is actually happening

The password login requests are reaching the backend, but recent auth logs show repeated `500/504` timeouts while the auth service tries to query the database. That means the user is not simply entering the wrong password, and the form itself is not the only problem.

There is also a separate TestFlight issue where the Face ID path can leave the UI spinning or retrying in a way that makes manual login feel blocked.

## Fix plan

1. Stabilise the background workload that is likely contributing to auth timeouts
   - Reduce the `radius-poller` scheduled job from every 5 seconds to a safer interval, or temporarily disable it while login is restored.
   - Keep the live tracking feature callable from the app, but stop the always-on backend job from hammering the project.
   - Check recent cron activity after the change so auth has breathing room again.

2. Make login resilient when the backend is slow
   - Keep the existing retry for transient auth failures, but improve the message so it clearly says the login service is busy and asks the user to retry, instead of implying bad credentials.
   - Avoid repeated automatic retries from Face ID when the backend is returning timeout errors.

3. Fix the TestFlight Face ID behaviour
   - Ensure Face ID never starts automatically on page load.
   - Keep a hard timeout so the spinner cannot stay forever.
   - If Face ID times out/fails, immediately return control to email/password login.
   - Do not save or use Face ID credentials until email/password has successfully signed in once.

4. Verify the actual route the user is on
   - Apply the login behaviour fix to `/instructor-app/login`, which is the current route.
   - Check `/instructor/login` as a legacy route only if it is still used by TestFlight.

5. Validate
   - Confirm direct database reads respond quickly after reducing the scheduled workload.
   - Re-check auth logs for fresh `/token` timeout errors.
   - Confirm the login screen no longer leaves a stuck Face ID spinner and manual sign-in is not blocked.

## Technical details

- Relevant frontend files:
  - `src/pages/instructor-app/InstructorLogin.tsx`
  - `src/pages/InstructorPortalLogin.tsx`
  - `src/lib/biometricAuth.ts`
  - `src/context/InstructorAuthContext.tsx`
- Relevant backend job:
  - Cron job `invoke-radius-poller-5s`, currently scheduled every `5 seconds`
- The backend currently reports healthy overall, but auth logs still show database connection/timeouts during login attempts, so the fix should address both the noisy scheduled job and the stuck Face ID UI.