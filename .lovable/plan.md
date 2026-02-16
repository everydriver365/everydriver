

# Consolidate Settings into One Unified Hub

## The Problem

Settings are currently scattered across 5+ different places:

1. **Main Settings page** (`/instructor/settings`) -- 7 categories with ~25 collapsible tiles
2. **Quick Settings sheet** -- slides up from the header cog with toggle switches
3. **Header dropdown menu** -- theme toggle, wallpaper, hero image, screen layout
4. **Appearance sheet** -- another bottom sheet for wallpaper/hero/layout
5. **Separate GPS Setup page** (`/instructor/settings/gps`) -- standalone page for Quartix

This means an instructor might look in 3 different places just to find a notification toggle or theme switch.

## The Solution

Merge everything into the existing **Main Settings page** and simplify the header to just link there.

### 1. Remove the Quick Settings Sheet

All 6 toggle sections (Visibility, Pupil App, Payments, Notifications, Website, Appearance) already have equivalents on the main settings page. Remove the `QuickSettingsSheet` component entirely.

### 2. Simplify the Header Dropdown

Replace the current dropdown (which has theme toggle, wallpaper, hero image, screen layout, and quick settings) with a streamlined version:
- **Settings** -- links to `/instructor/settings`
- **Profile** -- links to `/instructor/settings` (scrolls to profile)
- **Logout**

Remove the individual "Wallpaper", "Hero Image", and "Screen Layout" items -- these already live under Appearance and Dashboard Layout tiles in Settings.

### 3. Remove the Standalone Appearance Sheet

The header currently opens a separate `AppearanceSettings` bottom sheet. Remove this since the same component already exists as a tile in the Preferences & Data category on the main settings page.

### 4. Embed GPS Setup Inline

The "Vehicle GPS Device" tile currently just shows buttons that link out to `/instructor/settings/gps`. Instead, embed the `QuartixIdSearch` component directly (which it already partially does) and remove the "Device Setup" navigation button that sends users to a separate page. Keep the separate route working as a redirect for backward compatibility.

### 5. Add a Quick-Jump Bar to Main Settings

Add a horizontal scrollable chip/pill bar at the top of the settings page so users can quickly tap a category (Profile, Teaching, Payments, Website, Schedule, Tracking, Preferences) to jump straight to that section. This replaces the need for a separate Quick Settings panel.

### 6. Update the Menu Page

In the "Settings" section of the More menu:
- Keep "All Settings" pointing to `/instructor/settings`
- Keep "Mini-Website" and "FAQs"
- Move "My Profile" from the Account section to instead link to `/instructor/settings` with the profile category auto-opened

## Files Changed

| File | Change |
|------|--------|
| `src/components/instructor/QuickSettingsSheet.tsx` | Delete entirely |
| `src/components/instructor/InstructorMobileHeader.tsx` | Remove Quick Settings sheet, Appearance sheet, and simplify dropdown to just Settings/Profile/Logout |
| `src/pages/InstructorSettings.tsx` | Add horizontal quick-jump pill bar at top; embed GPS device content inline |
| `src/pages/InstructorMenu.tsx` | Move "My Profile" into Settings section |

## What It Looks Like After

- **Header cog**: Simple dropdown with Settings, Profile, Logout
- **Settings page**: One scrollable page with a quick-jump bar at the top and all 7 categories below
- **Menu > Settings section**: Clean list with All Settings, Mini-Website, FAQs, Profile
- **No more** floating sheets, duplicate toggles, or separate GPS pages

