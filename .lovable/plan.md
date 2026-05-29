# Single email + password login for Drive365

## Goal

Replace the current two-tab `/login` page with a single, simple page:
- One email field, one password field, one "Sign in" button
- Google sign-in button kept underneath
- "Forgot password" link kept
- No pupil/parent toggle — after sign-in we detect the role and send the user to the right place automatically
- Works for pupils, parents, and instructors (one front door for Drive365)

## What changes

### 1. `/login` page (replace contents of `src/pages/UnifiedLogin.tsx`)

- Remove the "Sign in / Parent access" tab switcher
- Remove all phone-number and OTP UI and handlers (`ParentCard`, `cleanUkPhone`, `send-parent-otp` / `verify-parent-otp` calls)
- Keep `UnifiedMobileLoginCard` as the single rendered card, wired to:
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.resetPasswordForEmail(...)` for "Forgot password"
  - `GoogleSignInButton` in the `googleSlot`
- Tagline updated to read for everyone, e.g. "For pupils, parents and instructors"
- On success → `navigate("/auth/redirect", { replace: true })` (unchanged; this already handles role-based routing)

### 2. Auth redirect

`/auth/redirect` already routes signed-in users to their correct portal (pupil dashboard, instructor dashboard, etc.). We will confirm it also handles a parent account (auth user linked to a `parents` row via `auth_user_id`) and send them to the parent portal. If the parent branch is missing, add it.

### 3. Routes (no change required)

- `/login` keeps the same route, just renders the simpler page
- `/pupil/login`, `/drive365/login`, `/p/login` already redirect to `/login` — they will continue to work and now land on the new combined form

## What stays the same

- The Drive365 branding, dark-slate styling, and `UnifiedMobileLoginCard` shell
- Per-instructor pupil login at `/pupil/login/:instructorSlug` (a separate page, not touched)
- The instructor login experience (instructors already use email + password through this same page)

## Important note about existing parents

Today, the `parents` table stores `phone` (required) and `auth_user_id`, but no `email`. Existing parent accounts were created through the phone/OTP flow and may not have an email/password set on their `auth.users` record.

For email + password parent sign-in to work, each parent needs:
1. An `auth.users` row with an email and password (or a Google account)
2. Their `parents.auth_user_id` linked to that user

**Options for handling existing parents (please pick one — happy to default to A):**

- **A. Invite flow (recommended):** Instructors invite parents by email from their dashboard; parent receives a "set your password" link and from then on uses email + password. Existing phone-only parents stay accessible to their instructor but cannot self-log in until invited.
- **B. Self sign-up:** Parents can register themselves at `/login` with email + password; an instructor links them to a pupil afterwards.
- **C. Keep OTP fallback:** Add a small "Sign in with phone instead" link under the form (against your "one page, one form" preference, but preserves the existing user base with zero migration).

This is the only decision that needs your input before I build — everything else above is mechanical.

## Files touched

- `src/pages/UnifiedLogin.tsx` — strip down to a single email + password card
- `src/pages/AuthRedirect.tsx` (or wherever `/auth/redirect` lives) — verify/extend parent routing
- No database migration unless you pick option A (which would add an invite token table) or B (which may need an `email` column on `parents` for convenience)

## Out of scope

- Mobile app shells, native deep links, instructor login styling tweaks
- Sign-up UX beyond "Forgot password" (no public signup form is being added unless you pick option B)
