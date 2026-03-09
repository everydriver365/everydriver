

## Plan: Fix Address Keystroke Saving + Achievement Badges Schema Mismatch

### Issue 1: Address saves on every keystroke
In `PupilPortalProfileEdit.tsx`, the `GoogleAddressAutocomplete` `onChange` directly calls `updateField("address", address)` which hits the database on every keystroke. Fix: use local state for the input value, only save to DB when a Google Places suggestion is selected.

**File: `src/components/pupil-portal/PupilPortalProfileEdit.tsx`**
- Add `addressValue` local state initialized from `pupil.address`
- Pass `addressValue` as `value` and `setAddressValue` as `onChange`
- Only call `updateField("address", ...)` inside a new `onAddressSelect` handler (triggered when user picks a suggestion, which fires both `onChange` with the final address and `onPostcodeChange`)

### Issue 2: AchievementBadges queries wrong columns
The code queries `badge_key, badge_label, badge_icon, badge_color` but the actual `pupil_achievements` table has: `achievement_type, achievement_name, icon_name, coins_awarded` (no badge_color column).

**File: `src/components/pupil-portal/AchievementBadges.tsx`**
- Update the query to select: `id, achievement_type, achievement_name, icon_name, earned_at`
- Update the interface to match actual columns
- Map `icon_name` to the icon map, use `achievement_name` as the label
- Use a default color (or derive from `achievement_type`) since `badge_color` doesn't exist

