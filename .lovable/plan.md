## What's happening

When you add a lesson in the mobile app, the row IS saved to the database, but the push to Google Calendar fails every time. The retry queue shows the exact same error on every attempt since **May 19, 2026**:

```
Failed to decode base64
```

This is thrown inside `supabase/functions/_shared/googleCalendarSync.ts` when it tries to decode the service-account private key (`GOOGLE_PRIVATE_KEY` secret) before signing the JWT used to talk to Google. Because the key can't be decoded, no access token is minted, no event is created, and the lesson stays in `calendar_sync_status = 'failed'`.

Your Google Calendar **is still connected** (`instructor_google_service_calendar` row is active) — that's why the *pull* side (`last_sync` updated today) keeps working via a different path. Only the *push* side, which uses the service account credentials, is broken.

The most likely cause is that `GOOGLE_PRIVATE_KEY` was re-saved with the literal `\n` characters mangled, surrounded by extra quotes, or pasted as the entire JSON without the `private_key` field intact.

## Fix

### Step 1 — Re-add the secret (you do this)

In Lovable Cloud → Secrets, update `GOOGLE_PRIVATE_KEY` with one of these forms (the loader already handles both):

- **Option A (recommended):** paste the *entire service-account JSON file contents* — the loader extracts `private_key` automatically.
- **Option B:** paste just the `-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----` block with real newlines (not the escaped `\n` text).

Also confirm `GOOGLE_SERVICE_ACCOUNT_EMAIL` is set to the service account's email.

### Step 2 — Harden the decoder (I do this)

Make `importPrivateKey` in `supabase/functions/_shared/googleCalendarSync.ts` more forgiving and produce a clearer error when the secret is misconfigured:

- Strip wrapping single/double quotes and BOMs.
- Handle keys that arrive base64-encoded *whole* (some hosts double-encode) by detecting and decoding one extra layer.
- Replace the generic `Failed to decode base64` with `GOOGLE_PRIVATE_KEY appears malformed — re-paste the service-account JSON or PEM block`, so future failures are obvious in the queue.

### Step 3 — Replay the stuck lessons

After the secret is fixed, re-queue the lessons currently marked `failed` so they sync without you re-adding them manually:

```sql
INSERT INTO calendar_sync_queue (lesson_id, instructor_id, action)
SELECT id, instructor_id, 'syncLesson'
FROM scheduled_lessons
WHERE calendar_sync_status = 'failed'
  AND deleted_at IS NULL
  AND status <> 'cancelled';
```

The existing `process-calendar-queue` cron will pick them up on its next run.

### Step 4 — Verify

- Add a test lesson on the mobile app.
- Check it appears in Google Calendar within a few seconds.
- Check `calendar_sync_queue` shows no new `Failed to decode base64` rows.

## Out of scope

- No UI changes.
- No changes to the connection record or the pull-side sync.
- No schema changes.