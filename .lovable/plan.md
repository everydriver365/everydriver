## Add temporary logging to reveal service account email

Add a one-line `console.log` to the Google Calendar JWT signing path in the relevant edge function (e.g. `process-calendar-queue` or the shared JWT helper) that prints `GOOGLE_SERVICE_ACCOUNT_EMAIL` to the function logs.

### Steps
1. Locate the edge function that reads `GOOGLE_SERVICE_ACCOUNT_EMAIL` (likely `process-calendar-queue` or a shared `_shared/google-jwt.ts`).
2. Add `console.log("[debug] GOOGLE_SERVICE_ACCOUNT_EMAIL:", Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL"))` near the top of the JWT build step.
3. Trigger the queue processor once.
4. Read edge function logs to retrieve the email value.
5. Share it back so you can confirm the matching service account in Google Cloud Console and regenerate the correct private key.
6. Remove the log line after the email is captured.

### Notes
- The email is not a sensitive secret (it ends in `iam.gserviceaccount.com` and is safe to view in logs).
- Private key is never logged.
