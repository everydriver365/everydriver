# Grab a Gap — native push via Despia + OneSignal

## What we now know (from Despia docs)

Despia ships push through **OneSignal**, not a proprietary API. That means:

- Sending is just the standard OneSignal REST call (`POST https://onesignal.com/api/v1/notifications`, `Authorization: Basic <REST_API_KEY>`). We do **not** store device tokens ourselves.
- Targeting is by `external_id` (OneSignal's "alias"), which Despia binds via the JS bridge `despia('setonesignalplayerid://?user_id=APP_USER_ID')`. We pass our own pupil id as the external_id.
- Deep-link on tap is built in: include a `url` field in the OneSignal payload and Despia opens that URL inside the WebView when the notification is tapped. Our existing `/?offer_id=…` web deep-link contract therefore works unchanged on native.

## Scope

Add a single native push path for pupils running inside the Despia wrapper, fanned out alongside the existing web-push path in `notify-pupil`. No change to web push, no Capacitor work, no parallel token table.

## Build steps

### 1. Bind pupil identity to OneSignal (native only)

- New hook `usePupilOneSignalBinding` mounted in the pupil app shell.
- Runs only when `detectNativeWrapper()` is true.
- On mount and on every pupil auth change:
  - `await despia('registerpush://')` (no-op if already granted; respects Despia's auto vs. manual permission mode — we'll default to manual so we can show our own pre-prompt later).
  - `despia('setonesignalplayerid://?user_id=' + pupilId)` using the authenticated pupil's id as the OneSignal `external_id`.
- Best-effort permission status read via `checkNativePushPermissions://`, stored in component state only (no DB row — OneSignal owns the subscription state).

### 2. Track which pupils have a native binding

We still need to know whether a pupil should receive a native push, otherwise `notify-pupil` would call OneSignal for every pupil including pure-web users (cheap but noisy).

- New table `pupil_native_push_bindings`:
  - `pupil_id uuid PRIMARY KEY references pupils(id) on delete cascade`
  - `platform text` ('ios' | 'android' | 'web-wrapper')
  - `last_seen_at timestamptz`
  - `permission_granted boolean`
- RLS: pupil can upsert their own row (`pupil_id = get_pupil_id_for_user(auth.uid())`), edge functions use service role.
- The binding hook upserts this row each time it runs.

### 3. New edge function `send-despia-push`

- Input: `{ pupil_id, title, body, data: { type, offer_id?, ... }, url }`.
- Looks up `pupil_native_push_bindings` for that pupil; if no row, returns `{ skipped: 'no_binding' }`.
- Calls OneSignal:
  ```
  POST https://onesignal.com/api/v1/notifications
  Authorization: Basic <ONESIGNAL_REST_API_KEY>
  {
    app_id: ONESIGNAL_APP_ID,
    include_aliases: { external_id: [pupil_id] },
    target_channel: 'push',
    headings: { en: title },
    contents: { en: body },
    url,            // Despia opens this in the WebView on tap
    data            // also available to in-app tap handler if needed
  }
  ```
- Logs result to `pupil_push_log` for parity with the web path.
- Requires two new secrets: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`.

### 4. Fan-out from `notify-pupil`

- In the existing pupil notification dispatcher, after the web-push fan-out, call `send-despia-push` in parallel with `Promise.allSettled` for the same pupil(s).
- For `slot_offer_available` and `slot_offer_cancelled`, the payload uses the exact same deep-link URL the web side already builds (`${APP_URL}/?offer_id=${offer_id}` and the cancelled variant). No new routing logic on the client — `?offer_id=` already shows the "no longer available" card when the offer is gone.

### 5. Tap handling (no new code required)

Despia opens the `url` field inside the WebView on tap, so the existing `useEffect` that reads `?offer_id=` from the URL handles native taps the same way it handles web taps. We will add a small belt-and-braces listener for `window.addEventListener('despia:notification', …)` only if QA shows the URL field is not honoured in some state (cold start vs. background). That's a follow-up, not a blocker.

## Out of scope

- Capacitor / Expo push (not used — Despia is the wrapper).
- iOS APNs / Android FCM cert wrangling (OneSignal owns this inside Despia).
- Migrating away from web push for browser pupils (web push stays as-is).

## Secrets needed before code

- `ONESIGNAL_APP_ID` (from OneSignal dashboard → Settings → Keys & IDs)
- `ONESIGNAL_REST_API_KEY` (same screen)

These come from the OneSignal app that Despia provisioned for the pupil app. They're requested via the secrets tool once the plan is approved.

## Verification

1. On a Despia build, log in as a test pupil → confirm `pupil_native_push_bindings` row appears with `permission_granted: true`.
2. Trigger a slot offer for that pupil → confirm OneSignal dashboard shows the delivery and the device receives it.
3. Tap the notification cold-start and from background → confirm the app opens to `/?offer_id=…` and the offer card renders (or the "no longer available" card if cancelled).
4. Confirm a pure-web pupil still receives the existing web push and is skipped by `send-despia-push` with `no_binding`.
