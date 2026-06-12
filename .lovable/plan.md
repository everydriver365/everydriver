## Goal
The Despia TestFlight build of EveryDriver shows a white screen on launch and never reaches the instructor login. Safari on the same iPhone, same URL, works. We need to find why the WebView boot fails, then fix it — without breaking the browser/PWA experience.

## Approach
Two phases. Phase 1 ships a tiny visible diagnostic so the next TestFlight build *tells us* what's happening. Phase 2 applies the fix based on what we see, then removes the diagnostic.

---

## Phase 1 — Boot Probe (small, safe, shippable now)

Add an always-on, very small overlay that's only visible inside a native wrapper (Despia / WKWebView) and only while the app is booting. It will display, top-left, in plain text:

- Build timestamp
- "JS started" (proves the bundle executed at all)
- "React mounted" (proves React rendered)
- Any uncaught error message + stack (top 3 lines)
- Whether `installBundleRefresh` triggered a hard-reload

Implementation outline:
- New file `src/lib/bootProbe.ts` that writes to a fixed `<div id="boot-probe">` injected into `index.html` (so it shows even before React mounts).
- Hook `window.addEventListener('error', …)` and `window.addEventListener('unhandledrejection', …)` at the top of `main.tsx`, before any other imports/side effects, and pipe messages into the probe.
- Tag `installBundleRefresh.hardReload` with a probe line so a reload loop is visibly obvious.
- Probe auto-hides 4 seconds after React mounts successfully on a real route — so production users never see it once the bug is fixed. Inside the wrapper only.

Then: publish, ask the user to open the TestFlight app, screenshot what's on screen, send it back.

## Phase 2 — Fix based on what the probe shows

Three likely outcomes and the fix for each:

**A) Probe shows "hard reload" repeating, or empty white with the build timestamp visible**
Root cause: stale service worker from previous browser visit + `bundleRefresh` loop.
Fix: in `main.tsx`, reorder so the wrapper-only SW/cache wipe (current lines 32-42) runs *before* `installBundleRefresh()`, and skip `installBundleRefresh()` entirely when `detectNativeWrapper()` is true (Despia auto-pulls latest published bundle on cold start — the refresh check is redundant and unsafe there).

**B) Probe shows an uncaught error before "React mounted"**
Root cause: a sync import or top-level side effect throws in WKWebView (commonly: missing `globalThis.crypto.randomUUID` on old iOS, an early `localStorage` access in private mode, or a polyfill gap).
Fix: wrap the offending call in a feature-detect / polyfill. The exact patch depends on the error line.

**C) Probe never appears at all (totally blank)**
Root cause: bundle isn't loading — Despia is showing its own splash and the JS never executes. Usually CSP / mixed-content / domain config inside Despia.
Fix: not a code change — confirm Despia's "Target URL" is `https://everydriver.co.uk` (not http), and that no CSP header from SiteGround blocks the wrapper UA. I'll list the exact Despia settings to check.

## Out of scope
- Capacitor `capacitor.config.ts` changes (Despia doesn't use it).
- Any change to the instructor auth flow itself — Safari proves that path is fine.
- Mobile UI / styling changes (per project Core rule: don't touch mobile layouts unless asked).

## What I need from you
1. Approve this plan.
2. After I ship Phase 1, **rebuild/republish the Despia TestFlight build** (Despia pulls fresh from `everydriver.co.uk` automatically on app launch, but if it caches the old bundle aggressively you may need to fully delete + reinstall the TestFlight app once to clear the WebView storage).
3. Screenshot the top-left overlay on launch and send it back. I'll apply the matching fix from Phase 2.
