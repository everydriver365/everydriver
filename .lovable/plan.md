

# Enhanced "Next Up" Tile with Mini Map and Expandable Actions

## Overview

Replace the current `NextLessonCard` with a richer tile that includes a mini map preview of the pickup location and an expandable section with quick actions (text, on-my-way, call, cancel, rearrange).

## What the Instructor Will See

- **"Next Up..." header** with pupil name, avatar, and time countdown
- **Payment status badge** (owes / credit / paid up) -- already exists, kept prominent
- **Mini map** showing the pickup location with a navigate button overlay
- **Expandable actions drawer** (tap to expand) with:
  - Text pupil (opens SMS)
  - Send "On my way" quick message
  - Call pupil (opens phone dialer)
  - Cancel lesson
  - Rearrange lesson
- The tile collapses back when tapped again

## Implementation Steps

### 1. Create new `NextUpTile` component
**New file:** `src/components/instructor/NextUpTile.tsx`

- Header row: "Next up..." label + countdown badge
- Pupil row: Avatar (using existing `PupilAvatar`), name, payment status badge
- Mini map: Geocode the pickup postcode (reuse `geocodePostcode` from `useTodayRoute.ts`), render a small `CoordsMapPreview` (non-expandable, 120px height) with a "Navigate" overlay button
- Expandable section using `Collapsible` from radix:
  - Grid of action buttons: Text, On My Way, Call, Cancel, Rearrange
  - "On My Way" sends a pre-filled SMS like "Hi [name], I'm on my way!"
  - Call opens `tel:` link
  - Cancel/Rearrange navigate to relevant pages or open confirmation dialogs
- Styled with the floating card standard (white bg, border, navy shadow)

### 2. Add postcode geocoding hook
**New file:** `src/hooks/usePostcodeGeocode.ts`

- Small hook that takes a postcode string, geocodes it via Nominatim (reusing the cache pattern from `useTodayRoute.ts`), and returns `{ lat, lng, isLoading }`
- Avoids duplicating geocoding logic

### 3. Update `InstructorMobileHome.tsx`
- Replace the current `NextLessonCard` usage (lines 332-346) with the new `NextUpTile`
- Pass all existing `nextLesson` data plus `pupilId` for cancel/rearrange navigation

---

## Technical Details

**Files to create:**
- `src/hooks/usePostcodeGeocode.ts` -- geocoding hook wrapping Nominatim with cache
- `src/components/instructor/NextUpTile.tsx` -- the new enhanced tile

**Files to modify:**
- `src/components/instructor/InstructorMobileHome.tsx` -- swap `NextLessonCard` for `NextUpTile`

**Existing components reused:**
- `PupilAvatar` -- for avatar with initials fallback
- `CoordsMapPreview` -- for the mini map (non-expandable mode, 120px)
- `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` -- for the expandable actions
- `Button` -- for action buttons
- Payment status logic from current `NextLessonCard`

**Data already available** from `useNextLessonDetails`:
- `pupilName`, `pupilProfileImage`, `pupilPhone`, `pickupPostcode`, `pickupLocation`, `startTime`, `minutesUntil`, `accountBalance`, `prepaidHours`, `pupilId`, `lessonId`

**Actions in expandable section:**
| Action | Behavior |
|---|---|
| Text Pupil | Opens SMS via `sms:` link |
| On My Way | Opens SMS pre-filled with "Hi [name], I'm on my way to you!" |
| Call | Opens `tel:` link |
| Cancel | Navigates to lesson detail or shows confirmation dialog |
| Rearrange | Navigates to reschedule flow |

