## Goal

Use the uploaded blue learner-car illustration as the **mobile login hero image** on:
1. Instructor portal mobile login (`InstructorPortalLogin.tsx`)
2. Pupil portal mobile login (`PupilLogin.tsx`)
3. Parent portal mobile login (`ParentPortal.tsx`)

All three mobile logins will then share the same shape: **photo hero → email + password form → "Forgot password" toggle → "Sign in with Face ID" button** (using the existing biometric pipeline that already powers Instructor and Pupil).

Desktop layouts are not touched.

---

## Part 1 — Asset

Copy `user-uploads://mobile_login_screen_250526.png` to `src/assets/mobile-login-hero.png`. Single asset reused by all three portals so future updates only touch one file.

## Part 2 — Instructor & Pupil (hero swap only)

Both pages already use the shared `MobileLoginHero` + `UnifiedMobileLoginCard` flow with email login, forgot password, and Face ID. Only change:

- `src/pages/InstructorPortalLogin.tsx` — replace `import instructorHero from "@/assets/every-instructor-hero.webp"` with the new asset, pass it as `heroSrc` to `MobileLoginHero`.
- `src/pages/PupilLogin.tsx` — replace `import pupilHero from "@/assets/drive365-hero-learner.webp"` the same way.

No logic changes. Face ID, forgot-password, deep-link arrival behaviour remain identical.

> Note: `src/pages/instructor-app/InstructorLogin.tsx` is the **marketing/SaaS** instructor login (not the in-app one). I'll swap its hero too for consistency since it shares the same `MobileLoginHero` component — say so if you want it left alone.

## Part 3 — Parent portal: phone OTP → email + password + Face ID

This is the structural change you confirmed.

### Schema migration

Add `parent_email` (nullable text, lower-cased + indexed) to `public.pupils`. Keep existing `parent_phone` for backward compatibility — not dropped.

### Auth flow

Replace the `MobilePortalLoginShell` phone/OTP screens with the same pattern Instructor/Pupil use:

```
MobileLoginHero  (new illustration)
   └─ Email + password form
         ├─ "Forgot password?" → reset-password email
         └─ "Sign in with Face ID" (when biometrics available + credentials saved)
```

Pieces:

- **Sign-in**: standard `supabase.auth.signInWithPassword({ email, password })`.
- **Forgot password**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" })`. The existing `/reset-password` page is already shared across portals.
- **Face ID**: reuse `@/lib/biometricAuth` (`isBiometricAvailable`, `saveBiometricCredentials`, `getBiometricCredentials`) exactly as Pupil/Instructor do, scoped with `biometricScope: "parent"`.
- **Children matching after sign-in**: change `fetchChildrenData` from `pupils.parent_phone ilike …` to `pupils.parent_email = session.user.email`. Phone-based fallback kept as a secondary `or()` clause so existing parents keep working until they're migrated.
- **First-time setup**: an empty "no children linked to this email" state with instructions to ask their instructor to add their email to the pupil record (handled in the instructor's pupil edit screen — covered in a follow-up if needed).

### Files touched

- `src/pages/ParentPortal.tsx` — replace `MobilePortalLoginShell` block (lines ~327–421) with `MobileLoginHero` + new email/password/Face ID form. Remove `parentPhone` / `otp` / `authStep` state for the entry flow, replace with `email` / `password` / `view: "login" | "forgot"`. Update `fetchChildrenData` to query by email first. Remove `send-parent-otp` / `verify-parent-otp` invokes.
- Migration: `ALTER TABLE public.pupils ADD COLUMN parent_email text; CREATE INDEX idx_pupils_parent_email ON public.pupils (lower(parent_email));`.
- RLS on `pupils` is unchanged (still controlled by instructor scope) — parents only ever read via the authenticated query.

### What is NOT removed

The `send-parent-otp` / `verify-parent-otp` edge functions stay deployed for now in case other surfaces (admin tools, instructor flows, etc.) still call them. They can be retired in a separate cleanup pass after we confirm no callers remain.

## Part 4 — Verification

- Build is clean.
- Mobile preview at `< md`: hero photo renders on all three login screens, email + password works, "Forgot password" sends reset email, Face ID button only appears when biometrics are available and credentials were saved on a prior sign-in.
- Desktop view (`md+`) for all three portals is visually unchanged.

## Open question

Want the marketing `instructor-app/InstructorLogin.tsx` hero swapped too, or only the three in-app portals?
