## What's actually happening

The screenshot is the **Drive365 pupil login** rendered by `PupilLogin` → `UnifiedMobileLoginCard` → `DarkMobileAuthForm`. Looking at the code as it currently stands in this project:

- `PupilLogin.tsx` already passes `biometricScope="pupil"` (line 325).
- `UnifiedMobileLoginCard.tsx` already shows the Face ID button whenever `biometricScope` is set and the user isn't on the forgot-password view (we removed the `bioAvailable` gate).
- `DarkMobileAuthForm.tsx` is the new white pill-field design.

So in the **Lovable preview**, this screen should already show the Face ID pill under the "Log in" button. The TestFlight/Despia screenshot doesn't — which means the device is running an **older bundle**, not that the code is wrong.

Two independent paths can produce a stale screen on TestFlight/Despia:

1. **Despia / TestFlight is serving its own embedded bundle**, not the live Lovable preview. Despia wraps a snapshot of `dist/` at the moment you generated the build. New Lovable edits do not reach that snapshot until you regenerate the wrapper and re-upload to TestFlight.
2. **The Capacitor config in this repo points at the preview URL** (`server.url` in `capacitor.config.ts`), but the TestFlight build was either uploaded before that line existed, or Apple/Despia is caching the WKWebView assets. Either way the device keeps showing the old HTML/JS.

## Plan

### 1. Confirm the preview is correct (no code change)
- Open the Lovable preview at `/login` (Drive365 pupil login) on a phone-sized viewport.
- Verify the Face ID pill appears under "Log in" and the pill-field design matches the screenshot — minus the missing Face ID.
- If the preview is already correct, the issue is 100% on the TestFlight/Despia side and no app code needs changing.

### 2. Add a tiny on-screen build marker (one small code change)
- In `DarkMobileAuthForm.tsx`, add a faint footer line under the "Contact your administrator" row showing `v + import.meta.env.VITE_BUILD_ID` (or `new Date(BUILD_TIME).toISOString().slice(0,16)` injected via Vite `define`).
- Purpose: when the user opens TestFlight, they can read the version stamp and immediately tell whether they're on the new bundle or a cached old one. This is the fastest way to end the "is it the new build?" loop forever.

### 3. Force WKWebView cache-bust on native loads
- In `capacitor.config.ts`, under `server`, add `androidScheme: 'https'` and document that the user must **delete the app from the device before reinstalling from TestFlight** (otherwise WKWebView keeps the old HTML/JS until cache eviction).
- No behavioural change to the web app; just a documented reinstall step.

### 4. Deliver clear shipping instructions to the user
After steps 1–3, hand the user a short, ordered checklist:

1. `git pull`
2. `npm install`
3. `npm run build`
4. `npx cap sync ios`
5. Open in Xcode → Product → Archive → upload to App Store Connect.
6. Wait for TestFlight processing email.
7. **On the device: delete the existing TestFlight app, reinstall the new build, open it.**
8. Confirm the version stamp at the bottom of the login matches the new build.

If they want to skip step 5–7 every time, they can also keep `server.url` pointing at the Lovable preview in `capacitor.config.ts` for development builds only — but **Apple will likely reject** a release build that loads its entire UI from a remote `lovableproject.com` URL, so production TestFlight builds should ship the bundled `dist/`.

## Files touched

- `src/components/auth/DarkMobileAuthForm.tsx` — add small version stamp at the bottom of the form.
- `vite.config.ts` — `define` a `__BUILD_TIME__` constant injected at build time.
- `capacitor.config.ts` — add `androidScheme: 'https'`, no behavioural change otherwise.

## Out of scope

- No auth, RLS, database, or business-logic changes.
- No design changes to the login itself — the redesign is already in place; this plan is purely about getting the existing change onto the device and proving it.
