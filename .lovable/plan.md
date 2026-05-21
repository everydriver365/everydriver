## Plan

1. **Add a hard timeout around instructor sign-in**
   - Wrap the email/password sign-in call so it cannot wait indefinitely.
   - If the auth request hangs, return a clear “login service is taking too long” message instead of leaving the button spinning.

2. **Make the login screen always reset loading state**
   - Ensure the `/instructor-app/login` form exits `Signing in…` after success, failure, timeout, or unexpected errors.
   - Keep the existing invalid-password and email-not-confirmed messages.

3. **Add the same safety cap to biometric login**
   - The Face ID / Touch ID path currently has no timeout on this login screen.
   - Add the same protection so it cannot stay in scanning/spinner state.

4. **Verify the user-facing failure path**
   - Check the relevant code path after edits so the form shows an error message instead of silently spinning if the backend stalls again.

## Technical details

- Files likely to change:
  - `src/context/InstructorAuthContext.tsx`
  - `src/pages/instructor-app/InstructorLogin.tsx`
- No database changes are needed.
- Lovable Cloud is currently responding normally, so this is a frontend resilience fix for hung auth requests and delayed backend responses.