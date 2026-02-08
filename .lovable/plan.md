
## Wire Up Real Push Notification Delivery for Lesson Reminders

### Problem

The push notification infrastructure is fully scaffolded (service worker, VAPID keys, subscription hooks, DB tables) but the actual Web Push delivery is **stubbed out** in three edge functions:

- `send-push-notification` -- has a `sendWebPush` function that sends raw unencrypted payloads (won't work with any push service)
- `send-lesson-reminders` -- logs "Push notification queued" but never sends
- `notify-pupil` -- logs "Would send push" but never sends

### Solution

Create a shared Web Push utility using the Deno-native `@negrel/webpush` JSR package, then wire it into all three edge functions so push notifications are actually delivered.

---

### What Changes

| Area | Change |
|------|--------|
| **Shared utility** | New `_shared/webpush.ts` -- imports `@negrel/webpush`, exports a `sendPush()` helper that takes a subscription + payload and delivers it using proper VAPID/ECE encryption |
| **send-push-notification** | Replace the broken `sendWebPush` function with the shared `sendPush()` utility |
| **send-lesson-reminders** | Replace the stub `sendPushNotification` function with actual delivery using the shared utility; also send push to **pupils** (via `pupil_push_subscriptions`) not just instructors |
| **notify-pupil** | Replace the "Would send push" log with actual delivery using the shared utility |

### No Database Changes

All tables (`push_subscriptions`, `pupil_push_subscriptions`) and secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) already exist.

---

### Technical Details

**New file: `supabase/functions/_shared/webpush.ts`**

- Imports `@negrel/webpush` from JSR (`jsr:@negrel/webpush`)
- Exports `importVapidKeys(publicKey, privateKey)` to initialize VAPID credentials
- Exports `sendPushNotification(subscription, payload, vapidKeys)` that:
  1. Builds a `PushSubscription` object from endpoint/p256dh/auth
  2. Encrypts the payload using the library's built-in ECE implementation
  3. Sends via the library's `sendPushMessage` with proper VAPID JWT headers
  4. Returns success/failure boolean
- Handles expired/invalid subscriptions (HTTP 404/410) by returning a flag so callers can clean up stale records

**Modified: `supabase/functions/send-push-notification/index.ts`**

- Import shared `sendPushNotification` from `../_shared/webpush.ts`
- Remove the broken `sendWebPush` function
- Call the shared utility for each subscription
- Delete stale subscriptions that return 404/410

**Modified: `supabase/functions/send-lesson-reminders/index.ts`**

- Import shared utility
- Replace the stub `sendPushNotification` function with real delivery
- Add pupil push notifications: query `pupil_push_subscriptions` for each lesson's pupil and send them a "Lesson Tomorrow" push
- Update `reminder_24h_sent_at` timestamp after successful send

**Modified: `supabase/functions/notify-pupil/index.ts`**

- Import shared utility
- Replace the "Would send push" log with actual `sendPushNotification` calls
- Clean up stale subscriptions on 404/410 responses

---

### Implementation Steps

| Step | Action |
|------|--------|
| 1 | Create `supabase/functions/_shared/webpush.ts` with the shared push delivery utility |
| 2 | Update `send-push-notification/index.ts` to use the shared utility |
| 3 | Update `send-lesson-reminders/index.ts` to deliver real pushes to both instructors and pupils |
| 4 | Update `notify-pupil/index.ts` to deliver real pushes |
| 5 | Deploy and test all three functions |
