## Goal
Create a mock pupil **Dave Kebab** assigned to instructor **Ken D**, with a working pupil-portal login:
- Email: `lrsp@dufosse.co.uk`
- Password: `Topsydog1&`

## Approach
Use the existing `pupil-email-auth` edge function (action: `register`) — it's the same path used by the public pupil signup flow, so it:
1. Creates the auth user with the given password
2. Inserts a `pupils` row linked to the chosen instructor
3. Wires up the `user_roles` entry as `pupil`

This keeps the account behaviourally identical to a real registration (no DB drift, no orphan rows).

### Steps
1. Invoke `pupil-email-auth` with:
   - `action: "register"`
   - `email: "lrsp@dufosse.co.uk"`
   - `password: "Topsydog1&"`
   - `name: "Dave Kebab"`
   - `instructorId: "c9843b58-6edb-4b97-8238-65d725e30aea"` (Ken D)
2. Verify the new `pupils` row exists and the auth user can sign in.
3. Confirm the pupil portal URL: `/p/ken-d` (Ken D's `app_slug`).

### Notes
- This writes to the live DB (real auth user + real pupil row). Per the Demo Data rule, mock pupils normally use Demo Mode, but here you've explicitly asked for a working login — so a real account is required. If you'd prefer it flagged for easy cleanup later, I can add `[MOCK]` to the notes field.
- No schema changes, no code changes — pure data setup via existing function.