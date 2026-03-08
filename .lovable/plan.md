

# Mobile Enhancements — Implementation Plan

The user selected items 4, 5, 6, 7, 9, 10, 11 from the suggestion list. After reviewing the codebase, several already have partial implementations. Here's what each needs:

## Existing vs. New

| # | Feature | Status | Work Needed |
|---|---------|--------|-------------|
| 4 | Waze-style community road alerts | `RoadAlertsRow` exists but is read-only, sourced from edge function | Add pupil/instructor reporting UI + community alert submission |
| 5 | Offline-first write queue | `useOfflineMutation` + `useOfflineSync` already exist | Extend to cover lesson notes and payments specifically; add visible sync status indicator |
| 6 | Voice-first lesson notes | `VoiceLessonNotes` component (257 lines) already exists | Add hands-free auto-start mode and integration into end-lesson flow on mobile |
| 7 | Shareable EOD summary card | `EndOfDaySummary` exists with TTS | Add share-as-image/link capability using canvas/screenshot |
| 9 | Monzo-style payment feed (pupil) | `PupilPaymentHistory` exists as a basic table | Redesign as a vertical timeline feed with icons, running balance, and category colors |
| 10 | Theory gamification (streaks/XP) | `TheoryMockTest` + `RedeemPointsSheet` exist | Add streak tracking, daily XP, progress animations, and streak-loss warnings |
| 11 | Pre-lesson checklist (pupil) | `LessonPrepChecklist` already exists with contextual items | Enhance with progress ring, push reminder, and instructor-customizable items |

## Implementation Details

### 4. Community Road Alerts (`CommunityAlertReporter.tsx`)
- New floating "Report" button on instructor mobile home (similar to Waze)
- Quick-tap categories: Roadworks, Accident, Speed Camera, Hazard
- Stores to new `community_road_alerts` table with lat/lng + expiry (2 hours)
- `useDrivingAlerts` hook extended to merge community alerts with existing weather/traffic alerts
- DB migration: `community_road_alerts` table with RLS (authenticated insert, public read within radius)

### 5. Offline Sync Status Indicator (`SyncStatusIndicator.tsx`)
- Small pill/badge showing pending sync count from IndexedDB `syncQueue` store
- Visible in mobile header when offline or items pending
- Pulse animation during active sync
- Tap to expand: shows queued items by type (notes, payments, GPS)
- Wire into existing `useOfflineMutation` — no new sync logic needed, just visibility

### 6. Hands-Free Voice Notes Mode
- Add "Hands-Free" toggle to existing `VoiceLessonNotes` that auto-starts listening on mount
- Add voice notes shortcut button to `EndLessonWizard` mobile flow
- Auto-save after 3 seconds of silence (use existing `interimTranscript` gap detection)
- No new components — enhance existing `VoiceLessonNotes.tsx`

### 7. Shareable EOD Summary Card (`ShareableEODCard.tsx`)
- New component that renders summary data as a styled card with instructor branding
- "Share" button on `EndOfDaySummary` that generates a shareable image via html2canvas or renders a branded card view
- Uses Web Share API (`navigator.share`) for native share sheet on mobile
- Fallback: copy-to-clipboard as text summary

### 9. Monzo-Style Payment Feed (`PupilPaymentFeed.tsx`)
- Replace basic `PupilPaymentHistory` table in pupil portal with vertical timeline
- Each entry: icon (lesson/top-up/refund), amount with +/- coloring, running balance line
- Group by month with sticky headers
- Pull from existing `payment_history` table — no schema changes
- Integrate into `BrandedPupilPortal.tsx`

### 10. Theory Gamification (`TheoryStreakTracker.tsx`)
- New component showing daily streak counter and XP points
- DB migration: `theory_streaks` table (pupil_id, current_streak, longest_streak, last_practice_date, total_xp)
- Award XP: 10 per question answered, 50 bonus for passing mock, streak multiplier
- Streak flame animation (framer-motion), streak-loss warning if no practice today
- Integrate above `TheoryMockTest` in pupil portal

### 11. Enhanced Lesson Prep Checklist
- Add circular progress ring showing completion percentage
- Allow instructors to set custom checklist items per lesson type (stored in `instructor_checklist_templates` or instructor settings JSON)
- Add "Ready!" confetti animation when all items checked
- Schedule push notification reminder 2 hours before lesson
- Enhance existing `LessonPrepChecklist.tsx` — no new component

## Database Migrations

1. `community_road_alerts` — id, reporter_id, alert_type, lat, lng, description, created_at, expires_at + RLS
2. `theory_streaks` — id, pupil_id (unique), current_streak, longest_streak, last_practice_date, total_xp + RLS

## Files

| File | Action |
|------|--------|
| `src/components/instructor/CommunityAlertReporter.tsx` | **New** |
| `src/components/instructor/SyncStatusIndicator.tsx` | **New** |
| `src/components/instructor/ShareableEODCard.tsx` | **New** |
| `src/components/pupil-portal/PupilPaymentFeed.tsx` | **New** |
| `src/components/pupil-portal/TheoryStreakTracker.tsx` | **New** |
| `src/components/instructor/VoiceLessonNotes.tsx` | Enhance with hands-free mode |
| `src/components/instructor/EndOfDaySummary.tsx` | Add share button |
| `src/components/pupil-portal/LessonPrepChecklist.tsx` | Add progress ring, confetti, custom items |
| `src/components/pupil-portal/TheoryMockTest.tsx` | Wire XP awards on completion |
| `src/hooks/useDrivingAlerts.ts` | Merge community alerts |
| `src/components/instructor/CleanHomeView.tsx` | Add CommunityAlertReporter |
| `src/pages/BrandedPupilPortal.tsx` | Swap payment history, add streak tracker |
| `src/components/instructor/InstructorMobileHeader.tsx` | Add SyncStatusIndicator |

