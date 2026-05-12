Do I know what the issue is? Yes.

Why it broke:
- There are two instructor login screens in the app.
- The previous fix was applied to `/instructor-app/login`, but the mobile/native instructor portal also uses `/instructor/login` via `InstructorPortalLogin.tsx`.
- That `/instructor/login` screen still auto-starts Face ID as soon as the page loads, and it has no timeout/safety fallback. In TestFlight, that leaves the spinner running and blocks normal email/password sign-in.
- I also found a native dependency mismatch: the project is on Capacitor 8, but `capacitor-native-biometric@4.2.2` is for older Capacitor versions. That can make Face ID unreliable in TestFlight.
- The earlier backend auth logs showed real 500/504 database/auth timeouts, but the hosted backend is healthy now and there are no fresh auth timeout logs. So the current failure is in the app login/biometric path, not the backend being down.

Plan to fix:
1. Patch the actual mobile login screen: `src/pages/InstructorPortalLogin.tsx`
   - Remove the automatic Face ID attempt on page load.
   - Only run Face ID when the user taps the button.
   - Add the same hard timeout/safety fallback used on the other login page.
   - Re-enable the email/password form immediately if Face ID fails, times out, or has no saved credentials.

2. Patch shared biometric handling: `src/lib/biometricAuth.ts`
   - Make native Face ID calls fail fast and return `null` instead of leaving the UI waiting.
   - Prefer saved credentials only after a successful biometric check.
   - Keep the manual email/password login path unaffected.

3. Update the native biometric package to the Capacitor 8-compatible maintained package
   - Replace the old `capacitor-native-biometric` package with the current Capacitor 8-compatible package.
   - Update imports/API calls only where needed.
   - Keep the existing saved credential behaviour and button text.

4. Reduce auth startup pressure
   - Stop unnecessary global auth role/profile checks from firing on public login pages where possible.
   - This avoids extra token/session work during sign-in and reduces the chance of refresh conflicts.

5. Validate
   - Confirm `/instructor/login` no longer auto-starts Face ID.
   - Confirm email/password submit is not blocked by biometric loading.
   - Confirm failed/timed-out Face ID shows a useful message and restores the form.
   - Check fresh auth/backend logs after the change.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>