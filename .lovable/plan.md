
# Plan: Instructor Mobile Home Page Enhancements

## ✅ COMPLETED

All 5 key improvements have been implemented:

| # | Feature | Status |
|---|---------|--------|
| 1 | Stronger Primary CTA | ✅ Done |
| 2 | Today at a Glance Strip | ✅ Done |
| 3 | Job Offer Urgency | ✅ Done |
| 4 | Smart Reminders | ✅ Done |
| 5 | One-Tap Swipe Actions | ✅ Done |

---

## Implementation Summary

### 1. Stronger Primary CTA ✅
- Added dynamic CTA button: "Start Today's Lessons" (when lessons exist) or "Go Live" (navigates to tracking)
- Made progress ring tappable → navigates to schedule
- Added touch feedback animations

### 2. Today at a Glance Strip ✅
Created `TodayOverviewStrip` component showing:
- Number of lessons today
- Total hours
- Expected earnings (based on instructor's hourly rate)
- First pickup postcode

**Files created:**
- `src/hooks/useTodayOverview.ts`
- `src/components/instructor/TodayOverviewStrip.tsx`

### 3. Job Offers Urgency ✅
- Added expiry timers (24h window) with color-coded urgency levels:
  - Normal (>4h): muted
  - Warning (1-4h): amber
  - Critical (<1h): red
- Added quick preview on job tiles: "Course Type • Xh • £Y"

**Files created/modified:**
- `src/hooks/usePendingJobsPreview.ts`
- `src/components/instructor/QuickActionTiles.tsx` (job preview)
- `src/components/instructor/JobOfferAlert.tsx` (expiry timer)

### 4. Smart Reminders ✅
Created `SmartRemindersCard` that shows contextual nudges:
- Displays when there's a schedule gap AND pending job offers
- "You have a 30-min gap at 2pm - X job offers waiting"
- Taps navigate to Jobs page

**Files created:**
- `src/components/instructor/SmartRemindersCard.tsx`

### 5. One-Tap Swipe Actions ✅
Added swipe-right gestures on Quick Action tiles:
- Schedule tile → Opens Google Maps to next pupil's location
- Pupils tile → Navigates to message last contacted pupil

**Files created/modified:**
- `src/hooks/useQuickTileActions.ts`
- `src/components/instructor/QuickActionTiles.tsx` (swipe gestures)

---

## Files Changed Summary

### New Files Created
1. `src/hooks/useTodayOverview.ts`
2. `src/hooks/usePendingJobsPreview.ts`
3. `src/hooks/useQuickTileActions.ts`
4. `src/components/instructor/TodayOverviewStrip.tsx`
5. `src/components/instructor/SmartRemindersCard.tsx`

### Modified Files
1. `src/components/instructor/InstructorMobileHome.tsx`
2. `src/components/instructor/QuickActionTiles.tsx`
3. `src/components/instructor/JobOfferAlert.tsx`

### No Database Changes Required
All features use existing tables.
