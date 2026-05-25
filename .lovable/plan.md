## Why the screen hasn't changed

Recent edits went into `src/components/auth/DsmBlueMobileLogin.tsx`, but the screen in your screenshot is rendered by **`DarkMobileAuthForm`** via `UnifiedMobileLoginCard`. `DsmBlueMobileLogin` is only used on `/instructor/login` (the portal route) and that route isn't what you're opening on Despia / TestFlight / the preview.

## What I'll do

Apply the redesign to the component that actually renders on every instructor login surface.

### 1. Rewrite `src/components/auth/DarkMobileAuthForm.tsx`

Replace the current dark glassmorphic layout with the white pill-field design we agreed on:

- White background (`#FFFFFF`), `#0F172A` text, `#8A96A6` muted, `#EEF1F5` field fill, `#0070C0` brand blue
- Centered **DSM wordmark logo** at the top (84px tall, no box / no glow / no frosted tile — just the PNG)
- "Welcome back" heading + subtitle
- Pill-shaped email field (Mail icon, `borderRadius: 999`, height 56)
- Pill-shaped password field (Lock icon + show/hide eye)
- Row: **Remember Me** toggle (left) + **Forgot password?** link (right)
- Primary **Log in** pill button in brand blue with soft shadow
- "or" divider
- **Face ID** pill button below (only shown when `biometricAvailable` is true) using the existing `onBiometric` handler
- Forgot-password view: email field + "Send reset link" button + back-to-sign-in link
- Inline error text + loading state preserved
- Keep all existing props and the `customFooter` slot so `UnifiedMobileLoginCard` and `instructor-app/InstructorLogin` keep working unchanged

### 2. Make sure DSM brand uses the wordmark, not the app icon

In `UnifiedMobileLoginCard.tsx`, DSM already resolves to `dsmLogo` (the wordmark). Your screenshot is showing the rounded square icon because the unified card is currently mis-detecting brand on this route. I'll force `brand="dsm"` to flow through, and confirm the resolved logo path renders the wordmark, not the Drive365 app icon.

### 3. Coverage

Because all three entry points use `DarkMobileAuthForm` (directly or through `UnifiedMobileLoginCard`), this single rewrite will update:

- `/login` (UnifiedLogin)
- `/instructor/login` portal — I'll also switch `InstructorPortalLogin.tsx` to render `UnifiedMobileLoginCard` instead of the now-orphan `DsmBlueMobileLogin`, so all three routes look identical
- The native instructor app (`instructor-app/InstructorLogin.tsx`)

### 4. Cleanup

- Leave `DsmBlueMobileLogin.tsx` in place but unused (safe to delete later if you want — say the word)

### Files touched

- `src/components/auth/DarkMobileAuthForm.tsx` — full redesign
- `src/components/auth/UnifiedMobileLoginCard.tsx` — minor: ensure DSM logo + subtitle pass through
- `src/pages/InstructorPortalLogin.tsx` — swap `DsmBlueMobileLogin` → `UnifiedMobileLoginCard`

No backend, no auth-logic changes — purely presentation.