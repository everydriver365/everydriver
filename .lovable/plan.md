
# Tracker App Reminder Before Lessons

## Overview

This feature adds an intelligent reminder system that prompts instructors to open the GPSgate Tracker app before their lessons start, ensuring GPS tracking is active for trip recording.

## How It Works

The reminder will:
1. Show a dismissible prompt on the home page when the next lesson is within 30 minutes
2. Only show if GPS status is "Offline" (no recent heartbeat from tracker)
3. Include a deep link to open the GPSgate Tracker app (or App Store if not installed)
4. Persist dismissal state per-lesson to avoid nagging

## Data Flow

```
useNextLessonDetails → nextLesson.minutesUntil (30 min threshold)
       ↓
useGPSConnectionStatus → isConnected: false triggers reminder
       ↓
TrackerReminderBanner component displays prompt
       ↓
localStorage tracks dismissed lesson IDs
```

## Implementation Details

### 1. New Component: TrackerReminderBanner

A compact, dismissible banner that appears above the Next Lesson card when conditions are met:

**Display conditions:**
- Next lesson exists AND minutesUntil <= 30
- GPS status is "offline" (no device heartbeat in 5+ minutes)
- User hasn't dismissed this specific lesson's reminder

**UI Design:**
- Amber/warning styling to draw attention
- Smartphone icon + clear message
- "Open Tracker" button with deep link
- Dismiss (X) button

```
┌──────────────────────────────────────────────────┐
│ 📱 Open GPSgate Tracker          [Open] [✕]    │
│ Start the app to record your upcoming lesson    │
└──────────────────────────────────────────────────┘
```

### 2. Deep Link Strategy

GPSgate Tracker app deep links:
- **iOS**: `gpsgate://` or App Store fallback
- **Android**: Intent URL or Play Store fallback

Implementation:
```typescript
const openTrackerApp = () => {
  // Try deep link first, fallback to app store
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const deepLink = "gpsgate://";
  const appStoreLink = isIOS 
    ? "https://apps.apple.com/app/gpsgate-tracker/id434645675"
    : "https://play.google.com/store/apps/details?id=com.gpsgate.tracker";
  
  // Attempt deep link with fallback
  window.location.href = deepLink;
  setTimeout(() => {
    window.location.href = appStoreLink;
  }, 1500);
};
```

### 3. Dismissal Logic

Store dismissed lesson IDs in localStorage with daily cleanup:

```typescript
const DISMISSED_KEY = "tracker_reminder_dismissed";

const isDismissed = (lessonId: string): boolean => {
  const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}");
  return dismissed[lessonId] === true;
};

const dismissReminder = (lessonId: string) => {
  const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "{}");
  dismissed[lessonId] = true;
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
};
```

### 4. Integration in InstructorMobileHome

Insert the banner between the greeting card and the Next Lesson card:

```tsx
{/* Tracker Reminder - show when offline and lesson soon */}
{nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
  <TrackerReminderBanner 
    lessonId={nextLesson.lessonId}
    minutesUntil={nextLesson.minutesUntil}
  />
)}

{/* Next Lesson Card */}
{nextLesson && (
  <NextLessonCard ... />
)}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/instructor/TrackerReminderBanner.tsx` | Create | New dismissible reminder component |
| `src/components/instructor/InstructorMobileHome.tsx` | Modify | Add TrackerReminderBanner import and placement |

## Technical Considerations

1. **Timing threshold**: 30 minutes before lesson gives enough time to start the app
2. **Offline detection**: Uses existing `useGPSConnectionStatus` hook (5-minute threshold)
3. **Per-lesson dismissal**: Prevents the same reminder from reappearing after dismissal
4. **Deep links**: Platform-specific handling with graceful fallback to app store
5. **No database changes**: Uses localStorage for dismissal state (ephemeral by design)

## User Experience

**Scenario**: Instructor opens home page 25 minutes before a lesson. GPS tracker is offline.

1. Banner appears: "Open GPSgate Tracker - Start the app to record your upcoming lesson"
2. Instructor taps "Open Tracker"
3. GPSgate Tracker app opens (or App Store if not installed)
4. Instructor starts tracking in the app
5. After ~30 seconds, GPS status changes to "Connected" and banner auto-hides
6. If instructor dismisses instead, banner won't show again for that specific lesson
