

## Add Tracking Provider Toggle to Instructor Settings

Currently, when an instructor has both Geotab and Radius/Kinesis devices, the system auto-selects based on a hardcoded priority list (`useActiveTrackingProvider.ts`). There is no way for the instructor to choose which provider they prefer.

### What we'll build

A new toggle in the instructor's profile/settings page that lets them choose their preferred tracking provider (Geotab or Kinesis). This preference will override the automatic priority selection.

### Steps

**1. Add `preferred_tracking_provider` column to `instructors` table**
- Migration: `ALTER TABLE instructors ADD COLUMN preferred_tracking_provider text DEFAULT null;`
- `null` means "auto" (use existing priority logic), otherwise `"geotab"` or `"radius"`

**2. Add a provider selector to `FeatureTogglesSettings.tsx`**
- Add a "Tracking Provider" section (before the existing toggles or as a standalone card) with a segmented control or radio group offering three options: **Auto**, **Geotab**, **Kinesis**
- Saves the selection to `instructors.preferred_tracking_provider`
- Only shown if the instructor has devices from more than one provider

**3. Update `useActiveTrackingProvider.ts` to respect the preference**
- After fetching active devices, check `instructor.preferred_tracking_provider`
- If set and valid (instructor actually has a device of that type), use it
- Otherwise fall back to existing priority logic

### Files to change
- **Migration SQL** — add `preferred_tracking_provider` column
- `src/components/instructor/FeatureTogglesSettings.tsx` — add provider selector UI
- `src/hooks/useActiveTrackingProvider.ts` — check instructor preference first

