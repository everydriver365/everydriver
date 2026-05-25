# Mobile login — correct logo per portal

Goal: each mobile login screen renders only its assigned logo, with the styling and subtitle text spec'd in the brief. Desktop screens, auth logic, layout, fields, Face ID and Google buttons stay untouched.

## Asset audit

Confirmed in the project (no new imports needed):

| Brand | File used |
|---|---|
| DSM logo | `src/assets/dsm-logo.png` (already imported) |
| Drive 365 app icon | `public/apple-touch-icon-365.png` (square rounded app icon — matches "Drive 365 icon" spec; the existing `drive365-logo.png` is a wide wordmark, not an icon) |

If you'd prefer the PWA tile `public/pwa-icon-365.png` instead, say so before I build — both are square Drive 365 icons; `apple-touch-icon-365.png` is the iOS-style rounded one and is the closer match to the brief.

## Current bugs the brief exposes

1. `UnifiedMobileLoginCard` auto-picks brand from `portalName` / pathname. `InstructorPortalLogin.tsx` passes `portalName="Drive365"`, so the instructor mobile login currently shows the Drive 365 logo — wrong, should be DSM.
2. Pupil + Parent mobile logins currently show the Drive 365 **wordmark** inside a glass square — looks cramped and isn't the app-icon styling the brief asks for.
3. Subtitle is hardcoded to `""` for the sign-in view, so none of the three required subtitle strings appear today.

## Changes (mobile only, behind `md:hidden` shell — desktop untouched)

### 1. `src/components/auth/UnifiedMobileLoginCard.tsx`

- Add two new optional props: `brand?: "dsm" | "drive365"` and `subtitle?: string`.
- Replace the path/name sniffing with an explicit prop:
  - `brand="dsm"` → `dsmLogo` + brandName `"DSM"` + DSM logo-block styling
  - `brand="drive365"` → `apple-touch-icon-365.png` + brandName `"Drive365"` + Drive 365 logo-block styling
  - If `brand` is omitted, keep current auto-detection as a fallback so admin/school/unified screens behave exactly as today.
- Pass through `subtitle` to `DarkMobileAuthForm` (instead of forcing `""` on the sign-in view).
- Pass through `brand` so the form can switch the logo container style.

### 2. `src/components/auth/DarkMobileAuthForm.tsx`

Add a `brand?: "dsm" | "drive365"` prop that swaps **only** the 80×80 logo block styling, per brief:

- `brand="dsm"` (or default):
  - 84×84, `border-radius: 22px`, `overflow:hidden`
  - `border: 1px solid rgba(255,255,255,0.20)`, `background: rgba(255,255,255,0.12)`
  - `<img>` with `max-width:100%; max-height:100%; object-fit:contain` centered
- `brand="drive365"`:
  - 84×84, `border-radius: 22px`, `overflow:hidden`
  - `border: 1px solid rgba(255,255,255,0.20)`, `background: transparent`
  - `<img>` with `width:100%; height:100%; object-fit:cover` (so the rounded app icon fills the tile edge-to-edge like an iOS icon)

Everything else in the form (title, fields, Sign In button, Face ID, footer, animations, dark blue background) is left exactly as it is.

### 3. The three login pages

| File | Change |
|---|---|
| `src/pages/InstructorPortalLogin.tsx` | Set `brand="dsm"`, `portalName="DSM"`, `subtitle="Sign in to your DSM instructor portal"`. Footer brandName already "DSM". |
| `src/pages/instructor-app/InstructorLogin.tsx` | Same as above (this is the native mobile-app instructor login). |
| `src/pages/PupilLogin.tsx` | Set `brand="drive365"`, `subtitle="Sign in to manage your driving lessons"`. |
| `src/pages/ParentPortal.tsx` | Set `brand="drive365"`, `subtitle="Sign in to track your child's progress"`. |

`AdminLogin`, `SchoolLogin`, `Drive365Login`, `UnifiedLogin` are intentionally **not** in scope — they keep whatever the auto-detection currently gives them.

## Verification

After build, on a mobile viewport:

| Screen | Logo shown | Logo NOT shown | Subtitle |
|---|---|---|---|
| `/instructor/login` (and instructor-app login) | DSM | Drive 365 | "Sign in to your DSM instructor portal" |
| `/pupil/login` | Drive 365 app icon | DSM | "Sign in to manage your driving lessons" |
| `/parent/login` | Drive 365 app icon | DSM | "Sign in to track your child's progress" |

No changes to desktop screens, auth flow, navigation, Google sign-in, Face ID, layout, colours, or fields.

## Files touched

- `src/components/auth/UnifiedMobileLoginCard.tsx`
- `src/components/auth/DarkMobileAuthForm.tsx`
- `src/pages/InstructorPortalLogin.tsx`
- `src/pages/instructor-app/InstructorLogin.tsx`
- `src/pages/PupilLogin.tsx`
- `src/pages/ParentPortal.tsx`
