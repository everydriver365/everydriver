

# Fix: All Lessons Must Appear in SMS Notifications, Welcome Email, and Google Calendar

## Problem Summary

Three issues found where only the first lesson is communicated:

1. **Instructor SMS** (`notify-instructor`, called from `create-booking` line 218-238): Only passes `firstLesson` data — one date/time. The instructor gets "New booking! John has booked a 60-min lesson on Mon 5 May at 10:00am" when they should see all scheduled lessons.

2. **Pupil Welcome Email** (`send-pupil-welcome`): Only receives and displays `firstLessonDate` and `firstLessonTime`. Shows "Your First Lesson" section with one date. Should list ALL lessons.

3. **Google Calendar**: The `process-calendar-queue` function has a `limit(10)` per run. For bookings with >10 lessons, remaining items wait for the next cron flush (5 min). Not a show-stopper but should be increased for reliability.

## Plan

### 1. Update `create-booking` to pass ALL lessons to notifications
**File:** `supabase/functions/create-booking/index.ts`

- **Instructor notification (line 216-242):** Pass all `sortedLessons` (date, time, duration) instead of just `firstLesson`.
- **Pupil welcome email (line 263-291):** Pass all lesson slots instead of just `firstLessonDate`/`firstLessonTime`.

### 2. Update `notify-instructor` to list all lessons in SMS
**File:** `supabase/functions/notify-instructor/index.ts`

- Add `allLessons` to the `NotifyRequest` interface.
- Update the `new_booking` case (line 87): If `allLessons` is provided, format a multi-line SMS listing each lesson date/time. Example:
  ```
  📅 New booking! John has booked 5 lessons:
  • Mon 5 May at 10:00am (2h)
  • Wed 7 May at 10:00am (2h)
  • Fri 9 May at 10:00am (2h)
  ...
  ```

### 3. Update `send-pupil-welcome` to show ALL lessons
**File:** `supabase/functions/send-pupil-welcome/index.ts`

- Accept an `allLessons` array parameter alongside the existing `firstLessonDate`/`firstLessonTime`.
- Replace the single "Your First Lesson" section with a "Your Scheduled Lessons" section that lists every lesson with date, time, and duration.
- Keep backward compatibility: if `allLessons` is not provided, fall back to showing just the first lesson.

### 4. Increase calendar queue batch size
**File:** `supabase/functions/process-calendar-queue/index.ts`

- Change `.limit(10)` to `.limit(50)` on line 230 to handle larger bookings in a single pass.

### 5. Apply same fixes to wallet payment path
**File:** `supabase/functions/square-booking-wallet-payment/index.ts`

- Pass all lesson data to `notify-instructor` (currently passes `slots.slice(0, 3)` — line 260).
- Send pupil welcome email with all lessons (if not already done in this path).

### Files Modified (5)
- `supabase/functions/create-booking/index.ts`
- `supabase/functions/notify-instructor/index.ts`
- `supabase/functions/send-pupil-welcome/index.ts`
- `supabase/functions/process-calendar-queue/index.ts`
- `supabase/functions/square-booking-wallet-payment/index.ts`

