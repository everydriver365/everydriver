Reset password for **Richard Chapman** (`richardchapman.adi@gmail.com`, auth_user_id `ecf34287-936c-41e7-b292-05ef4079cc3c`) to `Topsydog1&`.

### Steps
1. Create temporary edge function `admin-reset-password` that:
   - Validates caller's JWT and confirms admin role via `user_roles`.
   - Uses service role to call `auth.admin.updateUserById(user_id, { password })`.
2. Deploy and invoke it once for Richard's user_id with the new password.
3. Confirm success, then delete the function so it can't be reused.

### Note
Password is set immediately — no email sent. Share `Topsydog1&` with Richard securely and ask him to change it on next login.