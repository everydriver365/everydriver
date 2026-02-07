

## Problem

The branded pupil portal at `/p/:slug` (`BrandedPupilPortal.tsx`) still uses the old phone number lookup to identify pupils. This was never updated when the login system was changed to email/password. The phone lookup (line 171-198) simply searches by phone number with no password -- it's not real authentication.

The new email/password login page (`/pupil/login`) works correctly and stores session data, but the branded portal has its own separate, outdated login flow.

## Solution

Update `BrandedPupilPortal.tsx` to replace the phone number input with a redirect to the email/password login page, while keeping the session-based access for already-authenticated users.

### Changes

**1. Update `BrandedPupilPortal.tsx`**

- Remove the `phoneInput` state and `handlePhoneVerify` function (the old phone lookup)
- Remove the phone number input form UI
- When no pupil session is found, also check `sessionStorage.getItem("pupil_email_verified")` and look up the pupil by email + instructor ID
- If still no session, redirect to `/pupil/login` (or show a "Sign In" button that navigates there)
- Keep the existing session check (`sessionStorage.getItem(\`pupil_\${data.id}\`)`) so users who logged in via `/pupil/login` are recognized

**2. No backend changes needed** -- the `pupil-email-auth` edge function already returns the `instructorSlug` and stores the session correctly.

### Flow After Fix

1. User visits `/p/kenneth-dufosse`
2. Portal loads instructor branding
3. No session found -- user sees a "Sign In" button
4. Button navigates to `/pupil/login`
5. User logs in with email/password
6. On success, redirected back to `/p/kenneth-dufosse` with session stored
7. Portal loads pupil data from session

### Technical Detail

- The `PupilLogin.tsx` `performLogin` already stores `sessionStorage.setItem(\`pupil_\${data.instructorId}\`, data.pupilId)` and navigates to `/p/\${data.instructorSlug}`, so the branded portal's existing session check will pick it up automatically.
- The phone input UI and `handlePhoneVerify` function (~lines 65, 171-210, and the corresponding JSX) will be removed entirely.

