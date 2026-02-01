
# Plan: Display Lesson Details in Tomorrow Preview Card

## Overview
Update the Tomorrow Preview Card to show individual lesson details (pupil name, time, and duration) instead of just summary statistics.

## Current State
- The `useTomorrowPreview` hook already fetches lesson data including:
  - `pupilName`
  - `startTime`
  - `durationMinutes`
- However, this `lessons` array is not being passed to or displayed in `TomorrowPreviewCard`
- The card currently only shows: lesson count, total hours, expected earnings, and time range

## Implementation Steps

### Step 1: Update TomorrowPreviewCard Props
Add a `lessons` prop to accept the lesson array:
```typescript
interface TomorrowLesson {
  id: string;
  pupilName: string;
  startTime: string;
  durationMinutes: number;
}

interface TomorrowPreviewCardProps {
  // ... existing props
  lessons?: TomorrowLesson[];
}
```

### Step 2: Pass Lessons from InstructorMobileHome
Update the component usage to include the lessons data:
```tsx
<TomorrowPreviewCard
  // ... existing props
  lessons={tomorrowPreview.lessons}
/>
```

### Step 3: Display Lesson List in the Card
Add a lessons list section below the stats grid showing each lesson:
- Formatted time (e.g., "9:00 AM")
- Pupil name
- Duration in minutes (e.g., "60m")

The design will use a compact list format with:
- Time on the left
- Pupil name in the middle
- Duration badge on the right
- Subtle dividers between lessons
- Scrollable if more than 3-4 lessons

## Visual Design
```text
+----------------------------------------+
| Monday                    [Weather] [!] |
| 3 Feb                                   |
+----------------------------------------+
|   3      |    4.5    |     £158        |
| Lessons  |   Hours   |   Expected      |
+----------------------------------------+
| LESSONS                                 |
| 9:00 AM   John Smith          60m      |
| 10:30 AM  Sarah Jones         90m      |
| 1:00 PM   Mike Brown          60m      |
+----------------------------------------+
| 9:00 AM — 2:00 PM              View >  |
+----------------------------------------+
```

## Files to Modify
1. `src/components/instructor/TomorrowPreviewCard.tsx` - Add lessons prop and render lesson list
2. `src/components/instructor/InstructorMobileHome.tsx` - Pass lessons array to the card
