# Fix Face ID & Remember Me on the Instructor App

## What's actually broken

**Face ID button never appears**
- `isBiometricAvailable()` for web returns `true` only if `localStorage["instructor-biometric-enabled"]` is set.
- That flag is only set after `saveBiometricCredentials()` succeeds.
- In the Lovable preview iframe (and inside Despia's WKWebView) the browser `PasswordCredential` API throws `NotAllowedError: ... same-origin with all of its ancestors` — visible in the console logs (`[biometricAuth] saveBiometricCredentials failed`).
- Result: the flag is never set → the "Sign in with Face ID" button never renders, and Despia has no Capacitor plugin to fall back to (we ship `capacitor-native-biometric` but Despia is not a Capacitor host).

**Remember Me forgets the user**
- `enforceRememberMeOnBoot()` signs the user out at app start whenever `auth_remember_me=false` and the `sessionStorage` sentinel is missing.
- Inside Despia / standalone PWA the WebView's `sessionStorage` is wiped on every cold launch, so even users who logged in 10 minutes ago are kicked out.
- The "Remember me" checkbox also defaults to whatever the user last picked — first‑time users in the wrapper get `true`, but anyone who ever unticked it gets logged out on every launch with no obvious cause.

## Fix plan

### 1. Treat the native wrapper as a trusted device for sign-in
Add a small `isWrappedApp()` helper (Despia / Capacitor / standalone PWA / WKWebView) reused by biometric + remember-me logic. In `src/lib/biometricAuth.ts`:

- New `WrappedCredentialStore` that persists `{email, password}` in `localStorage` under a namespaced key per scope (e.g. `bio.instructor.v1`), lightly obfuscated (base64 + per-install salt; this is no worse than what Despia already keeps in WebView storage and matches what `PasswordCredential` would do).
- `isBiometricAvailable(scope)` returns `true` when:
  - native Capacitor + `NativeBiometric.isAvailable()`, **or**
  - wrapped app + a credential exists in the new store, **or**
  - regular browser + the existing `PasswordCredential` flag.
- `saveBiometricCredentials(scope, email, password)`:
  - try native, then `PasswordCredential`, then **always** fall back to the wrapped store when running inside Despia / standalone PWA.
  - swallow the `NotAllowedError` instead of aborting (it currently prevents the flag being written).
- `getBiometricCredentials(scope, reason)`:
  - native → keep current Face ID prompt.
  - wrapped → return the stored credential immediately (Despia has no OS biometric API; the button acts as a one-tap quick sign-in, gated by the device passcode that already locks the phone).
  - browser → existing `navigator.credentials.get()` path.
- `getBiometryLabel()` returns `"Quick Sign In"` when we're in a wrapped app without native biometrics, so the button reads correctly.

### 2. Make the login screens actually offer it
In `src/pages/instructor-app/InstructorLogin.tsx` and `src/pages/InstructorPortalLogin.tsx`:

- Always call `saveCredentialsForBiometric(...)` after a successful sign-in (today it's gated on `rememberMe`). The wrapper-store path is the only way the button ever appears, so saving must not be optional.
- After saving, re-run `isBiometricAvailable("instructor")` so the Face ID/Quick Sign-In button shows up immediately on next visit without needing a reload.
- Auto-prompt on mount when `isWrappedApp()` is true (mirrors the existing native auto-prompt) so reopening the app feels like Face ID unlock.

### 3. Stop logging users out on cold launch
In `src/lib/sessionPersistence.ts`:

- Default `getRememberMe()` to `true` (already true) **and** treat wrapped apps as "always remember": `enforceRememberMeOnBoot()` becomes a no-op when `isWrappedApp()` is true. Native apps and home-screen PWAs are explicit user installs; signing them out silently on every launch is wrong.
- On regular web, keep current behaviour but also write the sentinel on app boot when `remember=true`, so a future toggle to `false` doesn't immediately blow away the live session.
- Expose `clearRememberMe()` from the explicit Sign Out button paths (instructor + pupil + school + admin) so a real logout still clears the wrapper credential store via `clearBiometricCredentials(scope)`.

### 4. Wire the wrapper credential store into logout
Update `useInstructorAuth` (and the equivalent pupil/school/admin contexts only where biometric save is used) so `signOut()` calls `clearBiometricCredentials("instructor")` + `clearRememberMe()`. Without this, "Sign out" would leave the auto-login credential behind.

## Files to change
- `src/lib/biometricAuth.ts` — new wrapper-store fallback, swallow `NotAllowedError`, new label, share `isWrappedApp` helper.
- `src/lib/sessionPersistence.ts` — wrapper-aware boot enforcement, sentinel-on-boot.
- `src/hooks/useIsNativeWrapper.ts` — export a synchronous `isWrappedApp()` (also covers standalone PWA) for the libs above.
- `src/pages/instructor-app/InstructorLogin.tsx` — always save credentials on success, re-check availability, auto-prompt in wrapper.
- `src/pages/InstructorPortalLogin.tsx` — same treatment.
- `src/context/InstructorAuthContext.tsx` — clear biometric + remember-me on sign-out.

## Out of scope
- Pupil / School / Admin login screens already use the same helpers; the lib changes will benefit them automatically. No UI changes there unless you want the same auto-prompt behaviour — say the word and I'll include them.
- We will **not** ship a real Face ID gate inside Despia (Despia doesn't expose one). Inside the real Capacitor build (TestFlight) the native Face ID flow is unchanged.

Approve and I'll implement.