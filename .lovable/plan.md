## What we know

- TestFlight (Despia WebView): white screen after splash, no login.
- Safari on the same phone, same URL: works fine.
- We already shipped the boot probe (`src/lib/bootProbe.ts`), but you're seeing **nothing** — no green-on-black text top-left.

A blank white screen with **no probe text at all** means one of three things, in order of likelihood:

1. **The JS bundle never executes.** Despia is showing `everydriver.co.uk` but something (CSP header, wrong target URL, SW from a previous PWA visit hijacking the response) stops `index-*.js` from running. The probe code never runs, so nothing appears.
2. **`detectNativeWrapper()` returns false inside Despia**, so the probe self-disables. The current detector relies on `window.Despia` / UA containing "Despia" / iOS-without-Safari. Despia's WKWebView UA on some iOS versions *does* include "Safari", which would defeat heuristic #3 — and if Despia doesn't inject `window.Despia`, the probe gives up silently.
3. The probe runs but React throws before mount and the error overlay is being painted under the splash (less likely — Despia dismisses splash on first paint).

## Plan

### Step 1 — Make the boot probe unconditional (one small file change)

Change `src/lib/bootProbe.ts` so it **always installs** on any device (not gated by `detectNativeWrapper()`), but keeps auto-hiding 4s after React mounts so regular browser users still don't see it in production. This rules out cause #2 completely and guarantees we get diagnostic text on screen in TestFlight.

Also: render the probe immediately at the very top of `<body>` by injecting the `<div id="__boot_probe">` straight into `index.html` (a static HTML node, not JS-created) so it's visible **even if the JS bundle never runs**. Then `bootProbeLog()` just appends text to that pre-existing node. If JS never starts, you'll see the static "waiting for JS…" placeholder text — which proves cause #1.

### Step 2 — Add a one-shot "I'm alive" beacon to `index.html`

Inline a tiny `<script>` in `index.html` (before the module script) that writes `HTML loaded @ <time>` into the probe div. This runs **before** any module — if you see only this line and nothing else, the module bundle is being blocked by CSP / SW / network. If you don't even see this line, Despia isn't loading `everydriver.co.uk` at all (target-URL misconfig in Despia dashboard).

### Step 3 — Republish and reinstall

1. I publish.
2. You **delete the EveryDriver TestFlight app from the iPhone** and reinstall it from TestFlight. (Deleting is required to wipe the WKWebView storage / any SW left over from a prior PWA install — without this, Despia may keep loading the broken cached bundle.)
3. Open the app and screenshot the top-left text.

### Step 4 — Apply the matching fix

Based on what the screenshot shows:

- **Only "HTML loaded" appears** → CSP on SiteGround is blocking `/assets/*.js`, OR a leftover service worker is intercepting. Fix in code: have the wrapper-only branch in `main.tsx` run the SW + Cache Storage wipe **before** anything else, including before `installBundleRefresh()`, and skip `installBundleRefresh()` entirely under the wrapper (Despia auto-pulls latest on cold start, so the hash-check loop is unsafe and redundant there). I'll also list the exact SiteGround response-header to relax if CSP is the cause — that's a hosting change, not a code change.
- **"HTML loaded" + "JS started" + an ERROR line** → I'll fix the specific failing call (commonly a missing polyfill: `crypto.randomUUID`, `structuredClone`, or top-level `localStorage` access in private mode).
- **"React mounted" appears but screen still white** → React is up but a route guard is rendering nothing for the unauthenticated state in the wrapper. I'll fix the wrapper-specific render path.
- **Nothing appears at all** → Despia's "Target URL" setting is wrong (probably still pointing at the Lovable preview URL or `http://` instead of `https://`). Not a code fix — I'll give you the exact Despia setting to change.

## Out of scope

- No changes to the instructor auth flow (Safari proves it works).
- No mobile UI / styling changes.
- No Capacitor config changes (Despia doesn't use `capacitor.config.ts`).

## What I need from you

1. Approve this plan.
2. After I ship, **delete the app from the iPhone**, then reinstall from TestFlight and screenshot the top-left text on launch.
