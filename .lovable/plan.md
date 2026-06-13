## Goal
Give you working pupil login credentials for previewing the pupil portal.

## Existing test pupils (passwords are hashed and unrecoverable)
- `test@example.com` → Test Pupil on instructor `sarah-mitchell` (has a password, unknown)
- `test@example.com` → Test User on instructor `test-instructor`
- `sarah.test@example.com` → on instructor `ken-d`
- `test-qa-cash-20260608@example.com` → on instructor `ken-d`

All four are on instructors with `pupil_app_enabled = true`.

## Proposed credentials to provision
- **Email:** `test@example.com`
- **Password:** `TestPupil2026!`
- **Pupil:** "Test Pupil" on instructor `sarah-mitchell`
- **Login URL:** `/pupil/login/sarah-mitchell` (or `/login` then enter email)
- **Portal URL after login:** `/p/sarah-mitchell`

## Implementation
1. Create a one-off SQL migration that calls the existing `pupil-email-auth` password-hashing logic (or directly upserts into `pupil_credentials` using the same bcrypt/scrypt scheme already used in that edge function) to set the password for the `Test Pupil` row on `sarah-mitchell`.
2. Verify by selecting `password_hash IS NOT NULL` for that pupil.
3. Hand you the email + password + login URL.

## Notes
- No app code changes — purely a credential reset on an existing test account.
- If you'd rather use a different email/password or a different instructor slug, tell me before I run it.
