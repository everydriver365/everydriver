

# Single Active Tracker Selection

## Problem
You have 2 Quartix units linked (Yaris and Olivia), but the sync system tracks all units marked as `is_active: true`. There is no way to pick just one to track at a time.

## Solution
Add a "Set as Active" toggle to the Quartix Units list so only one unit tracks at a time. When you activate one unit, the other is automatically deactivated. The existing sync system already filters by `is_active = true`, so this works out of the box with no backend changes.

## What Changes

### 1. QuartixIdSearch.tsx (Quartix Units list in Settings)
- For linked units, replace the simple "Linked" badge with either an **"Active"** (green) or **"Inactive"** (grey) badge
- Add a **"Set Active"** button on inactive linked units that:
  - Sets all other Quartix devices for this instructor to `is_active: false`
  - Sets the selected device to `is_active: true`
- The "Unlink" button remains available on all linked units
- Active unit gets a prominent green highlight; inactive linked units get a subtle grey style

### 2. No database or backend changes needed
- The `quartix-sync` edge function already only processes devices where `is_active = true`
- The `TrackerSelectorTile` in live sessions already queries by `is_active` implicitly through the devices list

## User Experience
1. Go to Settings -> Vehicle GPS Device
2. See both Quartix units listed
3. One shows "Active" (green), the other shows "Linked" (grey)
4. Tap "Set Active" on the other unit to switch tracking to it
5. The previous unit automatically becomes inactive

## Technical Details
- When "Set Active" is tapped: batch update sets all instructor's Quartix devices to `is_active: false`, then sets the chosen one to `is_active: true`
- The footer summary updates to show "X units on Quartix / 1 active / Y linked"
- File modified: `src/components/instructor/QuartixIdSearch.tsx`

