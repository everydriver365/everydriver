# Despia Wrapping Readiness Checklist — everydriver

Despia wraps a published web URL into a native iOS/Android shell using a `WKWebView` (iOS) / `WebView` (Android), with native bridges for push, geolocation, file access, etc. This checklist audits the current codebase against what breaks, what needs config, and what needs code changes before submitting to the App Store / Play Store.

**Source URL to wrap:** `https://everydriver.lovable.app` (or a custom domain such as `everydriver.co`).

---

## 1. Push notifications — needs work

**Current state**
- `public/sw.js` registers a Web Push handler using VAPID keys.
- `src/hooks/usePushNotifications.ts` and `usePupilPushNotifications.ts` subscribe via `PushManager` and store the `endpoint` + `keys` in a Supabase `push_subscriptions` table.
- `supabase/functions/_shared/webpush.ts` sends Web Push payloads to those endpoints.

**Problem**
- Web Push **does not work inside a Despia WebView on iOS** — iOS only allows Web Push for installed PWAs added via Safari "Add to Home Screen", not for apps wrapped in a WebView.
- Android Chrome WebView technically supports it, but Despia routes notifications through its own native bridge (APNs on iOS, FCM on Android) for reliable background delivery.

**Action items**
- In the Despia dashboard, enable **Push Notifications** (provision APNs key + FCM `google-services.json`).
- Add Despia's JS bridge to capture the device push token (it exposes `window.Despia` or similar) and POST that token to a new Supabase edge function (e.g. `register-native-push-token`) which stores it in a new `native_push_tokens` table, keyed on `instructor_id` / `pupil_id` and platform.
- Update outgoing notification edge functions (`webpush.ts` and callers) to fan out to *both* Web Push subscriptions (for browser users) **and** native tokens via Despia's send-notification REST endpoint or directly via APNs/FCM.
- Keep `public/sw.js` for browser users — it stays valid for non-wrapped use.

---

## 2. GPS & background tracking — partial, needs native enhancements

**Current state (web APIs in use)**
- `useLessonRouteRecorder.ts` — `navigator.geolocation.watchPosition` + `navigator.wakeLock.request('screen')`.
- `useTrafficETA.ts`, `GoogleLiveTrackingMap.tsx`, `SatNavLiveMap.tsx`, `GPSClockInOut.tsx`, `CommunityAlertReporter.tsx`, `InstructorFindNearby.tsx`, `InstructorLiveSession.tsx` — all use `geolocation.getCurrentPosition` / `watchPosition`.
- `useGPSAutoReconnect.ts` and `useOfflineGPSQueue.ts` handle reconnection and offline buffering.

**Problem**
- `navigator.geolocation` works inside a WebView **only while the app is foregrounded and only after the native shell has been granted location permission**. The WKWebView prompt does not auto-request native permission — Despia must declare it in the iOS `Info.plist` and Android `AndroidManifest.xml`.
- **Background GPS does not work via the JS API.** As soon as the user backgrounds the app or locks the screen, `watchPosition` callbacks pause. The `wakeLock` API is also a no-op inside Despia's WebView.
- Lesson route recording will silently stop if the instructor backgrounds the app mid-lesson.

**Action items**
- In Despia dashboard, enable **Location** capability and set:
  - iOS: `NSLocationWhenInUseUsageDescription` and `NSLocationAlwaysAndWhenInUseUsageDescription` strings (e.g. "EveryDriver records lesson routes for instructors"), plus `UIBackgroundModes: location` if Despia exposes it.
  - Android: `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION` permissions.
- Confirm with Despia support whether their wrapper supports a **background geolocation bridge**. If not, accept the limitation and:
  - Add an in-app banner on `InstructorLiveSession` warning instructors to keep the app foregrounded during recording.
  - Rely on the existing **Radius telematics** integration (server-side, runs independent of the app) as the source of truth for trip data — see `mem://infrastructure/telemetry-and-mapping-architecture`. The web app's GPS recorder becomes a fallback rather than the primary recorder.
- Audit `useOfflineGPSQueue.ts` — confirm it flushes correctly when the app returns to foreground after a long background period (WebView may have been suspended).

---

## 3. OAuth redirect flows — one hardcoded URL needs fixing

**Current state**
- `src/pages/instructor/AccountingCallback.tsx` uses `${window.location.origin}/instructor/accounting-callback` — **good**, this adapts to whatever origin the WebView is on.
- `src/pages/instructor/SquareCallback.tsx` line 38: `redirect_uri: 'https://everydriver.lovable.app/instructor/square-callback'` — **hardcoded**, will break if you wrap from a custom domain (e.g. `everydriver.co`).
- `square-oauth` and `accounting-oauth` edge functions presumably echo these back to the upstream provider.

**Problem**
- OAuth providers (Square, Xero, QuickBooks, FreeAgent, Sage, Google) typically open the consent screen in the in-app WebView (or an external Safari View Controller, depending on Despia config). On redirect, the provider 302s to the registered `redirect_uri` — that URL must:
  1. Be in the provider's allow-list.
  2. Resolve back into the Despia-wrapped app, not Mobile Safari.
- A WebView-loaded OAuth page often doesn't allow `window.close()` (used in `SquareCallback`) — the user is stuck on the callback page.

**Action items**
- Replace the hardcoded `everydriver.lovable.app` in `SquareCallback.tsx` with `window.location.origin`, matching `AccountingCallback`.
- Add every domain you'll wrap (`everydriver.lovable.app`, `everydriver.co`, etc.) to each OAuth provider's redirect-URI allow-list.
- Replace `window.close()` with a `navigate('/instructor/settings')` fallback when running inside a WebView (detect via UA string containing `Despia` or absence of `window.opener`).
- Consider universal/app links (`https://everydriver.co/instructor/square-callback` registered as an Apple App Site Association entry) so the OS can route the redirect back into the wrapped app cleanly. Despia can register these.

---

## 4. Deep links / universal links — needs setup

**Current state**
- App uses `BrowserRouter` (verified by Lovable SPA fallback notes). Routes like `/i/{slug}` (mini-websites), `/quote/{token}`, `/pupil/login`, `/instructor/...`, `/~oauth` exist.
- No `apple-app-site-association` or `assetlinks.json` files in `/public`.

**Problem**
- Email/SMS/WhatsApp links pointing at `https://everydriver.co/quote/abc123` will open in Mobile Safari, not the wrapped app, unless universal/app links are configured.
- The `/~oauth` and Square/accounting callback paths must round-trip through the wrapper.

**Action items**
- Decide which paths should open natively. Likely candidates: `/quote/*`, `/pupil/*`, `/i/*`, `/instructor/square-callback`, `/instructor/accounting-callback`, `/~oauth/*`.
- In Despia dashboard, configure **Universal Links / App Links** for your custom domain.
- Add the following files to `/public/.well-known/`:
  - `apple-app-site-association` (JSON, no extension, served as `application/json`)
  - `assetlinks.json` (Android)
  - Despia provides the team ID + bundle ID + SHA-256 fingerprint to put into them.
- Verify Lovable hosting serves files from `/public/.well-known/` (it should — it's just static).

---

## 5. PWA / service worker behaviour — needs guarding

**Current state**
- `vite.config.ts` enables `VitePWA` with `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`.
- `runtimeCaching` aggressively caches Supabase responses with `NetworkFirst` for 1 day.
- `public/sw.js` is *also* registered separately for push (likely overlapping — VitePWA generates its own SW too; this is a smell).
- `index.html` has full iOS PWA meta tags (`apple-mobile-web-app-capable`, splash screens, status bar).

**Problem**
- Inside a Despia WebView, **the service worker still installs and runs**. This means:
  - Cached Supabase responses can become stale and serve old data after a release.
  - `skipWaiting: true` + `clientsClaim: true` causes hot SW swaps that can leave the WebView serving partially-updated assets.
  - Two competing SWs (`public/sw.js` for push + the Workbox SW from VitePWA) may race; only one will actually be active per scope.
- The PWA install prompts and "Add to Home Screen" UI are pointless inside a wrapped native app — they should be hidden when running in Despia.

**Action items**
- Detect Despia at runtime (UA sniff for `Despia` or use Despia's injected JS flag, e.g. `window.Despia?.platform`). Expose a `useIsNativeWrapper()` hook.
- When running inside Despia:
  - Skip SW registration entirely (early-return in `main.tsx` before VitePWA's auto-register fires; alternatively configure VitePWA with `injectRegister: null` and register manually with the guard).
  - Hide the `/install` page CTAs and any "Install app" banners (search `MobileHomepage.tsx`, `InstallInstructor.tsx`, `InstallPupil.tsx`, `InstallParent.tsx`).
  - Hide PWA-only iOS Safari instructions.
- Resolve the duplicate SW situation: either delete `public/sw.js` and move the `push` listener into the Workbox SW via `injectManifest` mode, **or** disable VitePWA's runtime caching and rely solely on `public/sw.js`. Recommended: keep VitePWA but extend its generated SW with the push handler — eliminates the race.
- Reduce Supabase `runtimeCaching` aggressiveness or scope it to specific GET endpoints; a 24h `NetworkFirst` over all of `*.supabase.co` will cause stale data inside the wrapped app after deploys.

---

## 6. Other native concerns worth flagging

- **Camera / file uploads** (dashcam UI, document vault, doodlepad, profile photos): WKWebView supports `<input type="file" accept="image/*" capture>` only if Despia enables the camera capability and declares `NSCameraUsageDescription` / `android.permission.CAMERA`. Verify in Despia dashboard.
- **WhatsApp / `tel:` / `mailto:` links**: WebViews block these unless Despia is configured to hand them off to the native shell. Confirm and test.
- **Klarna SDK** (`<script src="https://x.klarnacdn.net/kp/lib/v1/api.js">` in `index.html`): Klarna's hosted payment page typically requires popping out to a system browser for 3DS — confirm it works in the wrapped WebView, otherwise route Klarna checkout through an external Safari View Controller via Despia.
- **Square Web Payments SDK / GoCardless redirect**: same concern — 3DS challenges may need `target=_blank` to escape the WebView.
- **Microphone (voice commands, audio recorder hooks like `useAudioRecorder`, `useSpeechToText`)**: needs `NSMicrophoneUsageDescription` and Android `RECORD_AUDIO`.
- **Haptics** (`src/lib/haptics.ts`): web Vibration API works on Android WebView but is a no-op on iOS WebView. Accept the loss or wire through a Despia bridge if it offers one.
- **App Store review risk**: Apple may reject WebView wrappers that are "just a website" (Guideline 4.2). Adding native push, native location prompts, and at least one native-feeling feature (e.g. native splash, biometric unlock) is usually enough to pass. Despia handles splash + icons.

---

## Summary of code changes required (before wrapping)

1. **`src/pages/instructor/SquareCallback.tsx`** — replace hardcoded URL with `window.location.origin`; replace `window.close()` with a navigate fallback.
2. **`src/main.tsx`** (or wherever PWA registers) — add `useIsNativeWrapper()` guard and skip SW registration when wrapped.
3. **New hook `src/hooks/useIsNativeWrapper.ts`** — UA / `window.Despia` detection.
4. **Hide PWA install prompts** in `MobileHomepage.tsx`, `InstallInstructor.tsx`, `InstallPupil.tsx`, `InstallParent.tsx` when wrapped.
5. **New edge function `register-native-push-token`** + **new table `native_push_tokens`** + update `_shared/webpush.ts` callers to fan out to native tokens.
6. **`/public/.well-known/apple-app-site-association`** and **`/public/.well-known/assetlinks.json`** for universal/app links (values come from Despia after you create the app).
7. **`vite.config.ts`** — narrow Supabase `runtimeCaching` or shorten `maxAgeSeconds` to avoid stale-data complaints.
8. **In-app warning banner** on `InstructorLiveSession` advising instructors to keep the app foregrounded during route recording (background GPS limitation).

---

## What I'd do next

Approve this plan and I'll implement steps 1–4 and 7 immediately (they're pure code, no Despia account needed yet). Steps 5, 6, and 8 are best done after you've created the Despia app and have the bundle ID, team ID, FCM keys, and APNs key in hand — I'll do those in a second pass once you share those values.
