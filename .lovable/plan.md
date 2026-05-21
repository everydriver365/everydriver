## Findings

The failing login is not caused by a wrong password or the login form itself.

The live auth logs show repeated `/token` failures at the exact time of the attempts:

- `504 request_timeout`
- `500 Database error querying schema`
- `error finding user: failed to connect ... database=postgres`

Then one later `/token` request succeeds with `200`, which means the credentials are valid. The current app-side timeout is catching some failures and showing “login service is busy”, but the user experience still feels like it is spinning because successful/failed attempts can overlap and the post-login session/profile loading path is fragile.

## Plan

1. **Stop overlapping login attempts**
   - Add a request id / abort guard in the instructor login form so an old timed-out login cannot keep updating the UI after a newer attempt.
   - Keep the button disabled only for the active attempt.

2. **Make auth timeout handling deterministic**
   - Update the instructor auth context so the timeout result is typed and handled consistently.
   - Return a clear transient-service error immediately after the timeout instead of leaving any pending promise to race against the UI state.

3. **Separate “signed in” from “profile loaded”**
   - After a successful password token response, navigate only after the session is confirmed.
   - If the instructor profile/subscription follow-up queries are slow, show the dashboard loading state instead of leaving the login button spinning.

4. **Add safe diagnostics for the exact stuck point**
   - Add non-sensitive console timing logs around: password token request, session received, instructor profile fetch, subscription fetch, and redirect.
   - Do not log passwords, tokens, or private data.

5. **Check database performance for the post-login lookups**
   - Confirm the required indexes exist for `instructors.auth_user_id` and `instructor_subscriptions(instructor_id, status)`.
   - If the subscription lookup index is missing, add a small migration for that index so profile loading after login is faster and less likely to compound backend pressure.

## Technical notes

- I will not change credentials, auth providers, or the login design.
- I will not edit generated backend client files.
- If the hosted auth service itself times out again, the app cannot force the backend to accept the login, but it can stop the endless spinner and show exactly where it failed.