## What’s likely happening

Your native/TestFlight config is still pointing at the Lovable preview URL, not the published app. If preview stopped refreshing cleanly inside the WebView cache, Despia/TestFlight can sit on an old `index.html` bundle even though the Lovable preview looks newer in browser.

## Plan

1. **Make the update check more aggressive for wrapped apps**
   - Keep the existing bundle hash check.
   - Also run it shortly after app boot, not only after resume/login.
   - For Despia/Capacitor/WebView, bypass the 60s throttle on app foreground so it checks immediately.

2. **Clear WebView caches earlier**
   - When the app detects it is inside Despia/Capacitor/WebView, unregister service workers and clear Cache Storage on boot.
   - This avoids old browser/PWA cache entries blocking updates.

3. **Add visible diagnostics**
   - Add a small build/version value that can be inspected in console/local storage or an internal debug spot, so you can tell whether Despia/TestFlight is actually running the newest web bundle.

4. **Decide the TestFlight target**
   - If you want TestFlight to update from Lovable without rebuilding native each time: point `capacitor.config.ts` at the published URL, not the preview URL.
   - If you want proper App Store-style builds: remove `server.url`, then TestFlight only changes when you rebuild/upload a new IPA.

## Technical files to update

- `src/lib/bundleRefresh.ts`
- `src/main.tsx`
- Possibly `capacitor.config.ts` if you want TestFlight to stop using the sandbox preview URL.

## Recommendation

I’d implement steps 1 and 2 now, and change `capacitor.config.ts` to use `https://everydriver.lovable.app` if your goal is “mobile wrapper updates after Publish”.