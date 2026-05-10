# Harden Login & Security panel

Tighten the existing change-email / change-password / sign-out-everywhere panel so it's safer and clearer for instructors.

## Scope
Only `src/components/instructor/AccountSecurityPanel.tsx` (the component rendered by the "Login & security" settings item). No backend, RLS, or auth-provider changes.

## Changes

1. **Show the current login email**
   - Read it once on mount via `supabase.auth.getUser()`.
   - Display as a read-only line above the "new email" input ("Currently signed in as: …").

2. **Re-authenticate before sensitive changes**
   - Add a "Current password" input shared by the change-email and change-password flows.
   - Before calling `updateUser`, verify the current password by calling `supabase.auth.signInWithPassword({ email: currentEmail, password: currentPassword })`. If it fails, show an inline error and abort — do not call `updateUser`.
   - Skip the re-auth check for OAuth-only users (no password set) — detect via `user.app_metadata.provider !== 'email'` and hide the password field with a short note ("Signed in with Google — manage your password through your provider").

3. **Pass an explicit redirect on email change**
   - Call `supabase.auth.updateUser({ email }, { emailRedirectTo: \`${window.location.origin}/instructor/settings/login-security\` })` so confirming the new address lands the user back on this page.
   - After success, show a persistent inline banner ("Confirmation sent to new@example.com — click the link in that email to finish the change") in addition to the toast, so the user has a record after the toast disappears.

4. **Stronger password rules + visibility toggle**
   - Bump the minimum from 8 to 10 characters and require at least one number.
   - Add a show/hide eye toggle on both password inputs.
   - Validate on the client and surface inline errors; keep the existing toast for the server response.

5. **Confirm the "Sign out everywhere" action**
   - Wrap the button in an AlertDialog confirming "This will sign you out on every device, including this one."
   - On confirm, run the existing global sign-out and then `navigate('/instructor/login')`.

6. **Layout polish (no design system change)**
   - Group the three actions inside the existing portal section cards (already wrapping this panel) using the same `space-y-6` rhythm.
   - Keep all colours/tokens — no new palette.

## Out of scope
- Email template branding (separate flow).
- 2FA / MFA enrolment.
- Mobile portal layout (per project rule).
- Anything outside `AccountSecurityPanel.tsx`.

## Acceptance
- Current email is visible at the top of the section.
- Changing email or password requires entering the current password (for email/password users) and shows a clear inline error if it's wrong.
- After a successful email change, a banner remains on screen explaining the next step, and the confirmation link returns to `/instructor/settings/login-security`.
- "Sign out everywhere" prompts for confirmation before ending all sessions.
- Google-only accounts see a friendly note instead of a broken password field.
