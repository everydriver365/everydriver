

## Fix School Manager Portal Branding

The School Manager portal (`/school/dashboard`) currently shows the EveryDriver logo because `SchoolLayout.tsx` hardcodes `logoSrc="/everydriver-logo-v2.png"` and `logoAlt="DSM"`.

Per the project's branding convention, non-learner portals should use the **DSM (Driving School Manager)** logo and text. The DSM logo asset already exists at `src/assets/dsm-logo.png` and is used across the Instructor portal and other admin-facing layouts.

### Changes

**`src/components/school/SchoolLayout.tsx`**
- Import `dsmLogo` from `@/assets/dsm-logo.png`
- Change `logoSrc` from `"/everydriver-logo-v2.png"` to the imported `dsmLogo`
- Change `logoAlt` from `"DSM"` to `"Driving School Manager"`

This is a one-line fix that aligns the School Manager portal with the same DSM branding used in the Instructor portal and other admin-facing layouts.

