
# Plan: Instructor Mobile Home Page Enhancements

## Overview
Implement 5 key improvements to make the instructor mobile home page more actionable, informative, and delightful. These enhancements focus on reducing navigation friction and providing context-aware information at a glance.

## Feature Summary

| # | Feature | Impact |
|---|---------|--------|
| 1 | Stronger Primary CTA | Adds "Go Live" / "Start Today's Lessons" button, tappable progress ring |
| 2 | Today at a Glance Strip | Compact overview: lessons, hours, earnings, first pickup |
| 3 | Job Offer Urgency | Expiry timers + quick preview on tile |
| 4 | Smart Reminders | Context-aware nudges (gaps, traffic) |
| 5 | One-Tap Swipe Actions | Swipe/long-press shortcuts on tiles |

---

## Detailed Implementation

### 1. Stronger Primary CTA

**Current State**: The "Ready to Teach?" card is passive with no action button. Progress ring is display-only.

**Changes**:
- Add a prominent CTA button below the motivation text:
  - "Start Today's Lessons" (if lessons exist today)
  - "Go Live" (to tracking page)
- Make the progress ring tappable - navigates to today's schedule/checklist
- Add touch feedback with `whileTap` animation

**Files to Modify**:
- `src/components/instructor/InstructorMobileHome.tsx` - Add button and wrap ring in Link

### 2. Today at a Glance Strip

**Current State**: No summary strip exists. Users must navigate to Schedule/Money pages for this info.

**Changes**:
Create a new `TodayOverviewStrip` component displaying:
- Number of lessons today (from `scheduled_lessons`)
- Total hours today (sum of `duration_minutes`)
- Expected earnings (hours x instructor hourly rate)
- First pickup location/postcode (from first lesson's `pickup_location` or pupil address)

**Implementation**:
- Create new hook `useTodayOverview.ts` to fetch and calculate stats
- Create new component `TodayOverviewStrip.tsx`
- Place between motivational card and Quick Actions

**Data Query**:
```
scheduled_lessons WHERE lesson_date = today
  -> JOIN pupils for first pickup address
  -> Calculate: count, sum(duration_minutes), earnings
instructors -> hourly_rate for earnings calculation
```

**Files to Create**:
- `src/hooks/useTodayOverview.ts`
- `src/components/instructor/TodayOverviewStrip.tsx`

**Files to Modify**:
- `src/components/instructor/InstructorMobileHome.tsx` - Import and render strip

### 3. Job Offers Urgency

**Current State**: Job tile shows red badge count, but no urgency indicators or previews.

**Changes**:

**A. Add expiry timers to job offers**:
- Display "Expires in Xh" based on age since `created_at`
- Default expiry window: 24 hours from creation
- Show amber warning under 4h, red under 1h

**B. Quick preview on tile**:
- Show first job offer preview on the tile itself:
  - "Automatic - 2h - GBP70"
  - Format: `{course_type_short} - {hours}h - GBP{amount}`

**Files to Modify**:
- `src/components/instructor/QuickActionTiles.tsx` - Add preview text for job tile
- `src/components/instructor/JobOfferAlert.tsx` - Add expiry timer display
- May need to extend `usePendingJobsCount` to also fetch first job details

**New Hook**:
- `usePendingJobsPreview.ts` - Fetches first pending job for preview display

### 4. Smart Reminders

**Current State**: `useBreakReminders` hook exists and detects gaps between lessons, but no UI for smart nudges.

**Changes**:
Create a `SmartReminders` component that shows contextual nudges:

**Types of reminders**:
- Gap reminder: "You have a 30-min gap at 2pm - want to accept nearby job offers?"
- Early departure (future): Traffic-aware reminders (requires external API - mark as placeholder)

**Implementation**:
- Leverage existing `useBreakReminders` hook for gap detection
- Create `SmartRemindersCard.tsx` component
- Display as a subtle card below Today Overview or above Quick Actions
- Tapping the reminder opens relevant action (Jobs page for gap reminder)

**Files to Create**:
- `src/components/instructor/SmartRemindersCard.tsx`

**Files to Modify**:
- `src/components/instructor/InstructorMobileHome.tsx` - Add component

### 5. One-Tap Swipe Actions

**Current State**: Tiles only support tap navigation. `QuickActionTiles.tsx` uses framer-motion for reorder but not swipe actions.

**Changes**:
Add swipe-right actions to Quick Action tiles:

| Tile | Swipe Action |
|------|--------------|
| View Schedule | Navigate to next pupil (opens maps) |
| My Pupils | Message last contacted pupil |

**Implementation**:
- Add swipe gesture detection using framer-motion's `useDragControls` / pan gestures
- When swiped right (>80px), reveal action button
- Execute action and snap back

**Technical Approach**:
```
onPan -> track x offset
if x > threshold -> show action indicator
onPanEnd -> execute action if confirmed
```

**Required Data**:
- Next pupil: First upcoming lesson's pickup location
- Last pupil: Most recently messaged pupil (from `messages` table or fallback to first pupil)

**Files to Create**:
- `src/hooks/useQuickTileActions.ts` - Fetches next pupil address, last contacted pupil

**Files to Modify**:
- `src/components/instructor/QuickActionTiles.tsx` - Add swipe gesture logic in view mode

---

## Visual Layout After Changes

```
+------------------------------------------+
| EVERY DRIVER.CO.UK          [QR][Avail]  |
+------------------------------------------+
|        [Hero Image with gradient]        |
+------------------------------------------+
| Today                         [Online]   |
| READY TO TEACH?               [Progress] |
| Enjoy your lessons...           Ring     |
|                                  |       |
|   [ Start Today's Lessons ]     v       |
|                              (tappable)  |
+------------------------------------------+
| Today at a Glance                        |
| Lessons: 3  Hours: 4.5  GBP180           |
| First pickup: SW1A 1AA                   |
+------------------------------------------+
| Smart Reminder (if applicable)           |
| "30-min gap at 2pm - view job offers?"   |
+------------------------------------------+
| Quick Actions                    [Edit]  |
| [View Schedule  ->]  (swipe for nav)     |
| [My Pupils] [Job Offers]                 |
|             "Auto - 2h - GBP70"          |
| [Payments] [Fill Gaps]                   |
+------------------------------------------+
```

---

## Technical Details

### New Files to Create

1. **`src/hooks/useTodayOverview.ts`**
   - Query today's scheduled lessons with pupil join
   - Return: lessonCount, totalHours, expectedEarnings, firstPickupLocation

2. **`src/hooks/usePendingJobsPreview.ts`**
   - Fetch first pending job offer details
   - Return: courseType, hours, estimatedPayment, expiresIn

3. **`src/hooks/useQuickTileActions.ts`**
   - Fetch next lesson's pickup for navigation
   - Fetch last contacted pupil for messaging

4. **`src/components/instructor/TodayOverviewStrip.tsx`**
   - Compact horizontal strip with icons and stats
   - Mobile-optimized, single row design

5. **`src/components/instructor/SmartRemindersCard.tsx`**
   - Uses `useBreakReminders` hook
   - Displays contextual nudge with action button

### Files to Modify

1. **`src/components/instructor/InstructorMobileHome.tsx`**
   - Add CTA button to motivational card
   - Wrap progress ring in tappable Link
   - Import and render `TodayOverviewStrip`
   - Import and render `SmartRemindersCard`

2. **`src/components/instructor/QuickActionTiles.tsx`**
   - Add job preview text for Jobs tile
   - Add swipe gesture handling in view mode
   - Show swipe action indicators

3. **`src/components/instructor/JobOfferAlert.tsx`**
   - Add expiry timer calculation and display
   - Show urgency colors based on time remaining

### No Database Changes Required
All features use existing tables:
- `scheduled_lessons` (lessons, pickup locations)
- `course_enquiries` (job offers, created_at for expiry)
- `instructors` (hourly_rate for earnings)
- `pupils` (addresses, phone numbers)
- `messages` (for last contacted pupil)

---

## Implementation Order

1. **Today Overview Strip** - Highest value, self-contained
2. **Stronger Primary CTA** - Quick win, simple change
3. **Job Offers Urgency** - Expiry timer + preview
4. **Smart Reminders** - Builds on existing hook
5. **One-Tap Swipe Actions** - Most complex, do last

## Estimated Scope
- 5 new files (3 hooks, 2 components)
- 3 modified files
- No database migrations required
