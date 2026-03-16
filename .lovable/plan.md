

## Problem

The instructor's `buffer_minutes` setting (e.g. 30 min) is fetched from the database and available in `BookingSummary.tsx`, but it is **never passed to or used by** any of the slot-generation components. This means:

1. **`LessonScheduler`** (public booking) — no buffer around external calendar events or between selected slots
2. **`RescheduleLessonSheet`** (pupil reschedule) — no buffer around existing lessons or calendar events  
3. **`StepBookNext`** (instructor end-lesson quick-book) — no buffer around existing lessons or calendar events

All three paths check for direct time overlap only, with zero padding.

## Plan

### 1. Add `bufferMinutes` prop to `LessonScheduler`
- **File:** `src/components/booking/LessonScheduler.tsx`
- Add `bufferMinutes` to the props interface (default `0`)
- In `getAvailableTimeSlots()`, expand the conflict zone for both external calendar events and already-selected slots by `bufferMinutes` on each side — i.e. a slot at 10:00–11:00 with 30 min buffer blocks 09:30–11:30
- In `conflictsWithExternalEvents()`, pad `eventStart` backward and `eventEnd` forward by `bufferMinutes`
- In the selected-slot conflict check, pad `s.startTime` backward and `s.endTime` forward by `bufferMinutes`

### 2. Pass `bufferMinutes` from `BookingSummary` and `MobileBookingView`
- **File:** `src/pages/BookingSummary.tsx` — pass `bufferMinutes={instructor.buffer_minutes}` to `<LessonScheduler>`
- **File:** `src/components/booking/MobileBookingView.tsx` — same prop pass-through

### 3. Add buffer to `RescheduleLessonSheet`
- **File:** `src/components/instructor/RescheduleLessonSheet.tsx`
- Accept `bufferMinutes` prop (or fetch it from instructor data already available)
- In `getAvailableTimeSlots()`, pad existing lesson times and calendar event times by `bufferMinutes` when checking conflicts

### 4. Add buffer to `StepBookNext`
- **File:** `src/components/instructor/end-lesson/StepBookNext.tsx`
- Fetch `buffer_minutes` from the instructor record alongside existing lesson data
- When checking `lessonConflict` and `calConflict`, expand the busy windows by `buffer_minutes`

### Technical detail

Buffer expansion uses the existing `addMinutesToTime` helper. For a lesson/event occupying `[start, end]`, the blocked zone becomes `[start - buffer, end + buffer]`. This prevents any new lesson from starting or ending within the buffer zone of an existing commitment.

