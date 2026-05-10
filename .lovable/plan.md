## Goal
Make it clear on the instructor sign-in screens **where** Face ID and Remember me actually work, so the option doesn't look broken when running in a browser.

## Changes

**1. Add an environment-aware hint under the sign-in form**

On both `src/pages/InstructorPortalLogin.tsx` and `src/pages/instructor-app/InstructorLogin.tsx`, render a small helper line below the Remember me checkbox. Wording adapts based on `isNativePlatform()` / `isWrappedApp()` from `src/lib/biometricAuth.ts`:

- **Native app (Capacitor)**: "Face ID / Touch ID is enabled on this device."
- **Installed PWA / WebView**: "Quick Sign In is available after your first sign-in."
- **Regular browser**: "Face ID is only available in the iOS or Android app. Remember me will keep you signed in on this browser."

Style: 12px, `text-muted-foreground`, sits directly under the Remember me row. No layout shift on existing forms.

**2. Tooltip on the Remember me label**

Wrap the existing "Remember me" label in a small `Tooltip` (already in the design system) explaining: "Keeps you signed in on this device until you sign out. Without it, you'll be signed out when the browser closes."

**3. No behavioural changes**

`saveBiometricCredentials`, `setRememberMe`, the Face ID button, and the Supabase session persistence logic stay exactly as they are. This is purely a clarity / UX fix.

## Files touched
- `src/pages/InstructorPortalLogin.tsx`
- `src/pages/instructor-app/InstructorLogin.tsx`

## Out of scope
- Pupil / Admin / School login pages (can do those next if you want — say the word).
- Any changes to the actual auth flow.
