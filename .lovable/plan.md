## Diagnosis

The app renders correctly in the preview/Safari path, so the React page is not globally broken.

The TestFlight symptom — splash screen disappears, then a blank white WebView — matches Despia’s documented failure mode for apps using PWA/service-worker caching. This project currently has two service-worker paths:

- `vite-plugin-pwa` in `vite.config.ts`, using Workbox, auto-update, `clientsClaim`, navigation fallback, and cached JS/CSS/HTML.
- Manual push-notification service worker registration via `/sw.js`.

That combination is risky inside a Despia/WKWebView wrapper because the WebView can keep serving stale/broken cached `index.html` or asset responses before React ever gets a chance to clear caches.

## Plan

### 1. Disable Workbox/PWA service-worker generation

Remove `VitePWA(...)` from `vite.config.ts` and remove the `vite-plugin-pwa` import.

Why: Despia’s own docs call PWA build plugins the #1 cause of OTA update/blank-screen problems. This app does not need Workbox navigation caching for TestFlight, and push notifications already use the separate `/sw.js` worker.

### 2. Keep the manual push worker, but prevent it from hijacking pages/assets

Update `public/sw.js` so it remains push-only:

- No `clients.claim()` during activate.
- No fetch handler.
- No page/navigation caching.

Why: this lets browser push continue to work where supported, without letting the worker control app startup in WKWebView.

### 3. Move the WebView cache wipe to the earliest safe point

Update `src/main.tsx` so when `detectNativeWrapper()` is true:

- unregister service workers and delete Cache Storage immediately after imports resolve;
- skip `installBundleRefresh()` entirely in the wrapper;
- keep `installBundleRefresh()` for regular browsers/PWAs only if needed.

Why: the current code installs bundle refresh before the wrapper cache wipe, which can contribute to reload loops or stale-bundle checks inside Despia.

### 4. Keep the visible boot probe temporarily

Leave the HTML/JS boot probe in place for this next TestFlight check.

Expected result after publish + deleting/reinstalling the TestFlight app:

- If the app opens normally, we then remove the diagnostic probe in a follow-up cleanup.
- If it still whitescreens, the probe should now show whether Despia loaded HTML, module JS, or React.

## After implementation

You’ll need to:

1. Publish/update the frontend.
2. Delete the TestFlight app from the iPhone.
3. Reinstall from TestFlight.
4. Open it and confirm whether the login/home screen appears, or send the boot-probe text if it still blanks.
