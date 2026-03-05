

## Booking-to-Bonus Flow Analysis

### Current State

I've traced the entire flow end-to-end. Here's what exists and what's missing:

#### 1. Booking via Drive 365 Website — WORKS
When a pupil books via the public booking portal (`bookings.drive365.co.uk`), the `create-booking` edge function:
- Creates a pupil record linked to the instructor
- Creates scheduled lessons in `scheduled_lessons` table (added to diary)
- Records payment via `payment_history`
- Sends instructor notification
- Syncs to Google Calendar

#### 2. Lessons Appear in Instructor Diary — WORKS
Scheduled lessons are inserted into the `scheduled_lessons` table with the correct `instructor_id`, so they appear in the instructor's calendar/diary.

#### 3. Payment Recording — WORKS
The booking flow records the initial payment (full or deposit) in `payment_history` and sets `account_balance` on the pupil. The `EndLessonWizard` also correctly deducts lesson costs from the balance after each completed lesson.

#### 4. Instructor Marks Course as Finished → £50 Bonus — DOES NOT EXIST
This is the **missing piece**. Currently:
- The `InstructorBonusManager` is an **admin-only** manual tool where an admin clicks +/- to adjust a `bonus_earned` field on the instructor
- There is **no mechanism** for an instructor to "mark a course as finished"
- There is **no automatic trigger** that awards a £50 bonus when all lessons are completed
- The `EndLessonWizard` completes individual lessons but has no logic to check "was that the last lesson in this course?"

### What Needs to Be Built

1. **Course completion detection** — After a lesson is marked complete, check if all `scheduled_lessons` for that pupil are now `completed`. If so, flag the pupil's course as finished (e.g. set `status = 'completed'` on the pupil record).

2. **Instructor "Mark Course Complete" action** — Add a UI action (button on pupil card or end-of-last-lesson prompt) that lets the instructor explicitly mark the course as finished.

3. **Automatic £50 bonus trigger** — When a course is marked complete, automatically increment the instructor's `bonus_earned` by 50 and record this in `payment_history` for audit trail.

4. **Bonus notification** — Notify the instructor that they've earned a £50 bonus for completing a course.

### Implementation Plan

**Step 1: Add course completion status tracking**
- Add a `course_status` column to `pupils` table (values: `active`, `completed`) if not already present
- Create an "Mark Course Complete" button on the pupil detail/card UI

**Step 2: Auto-detect last lesson completion**
- In `EndLessonWizard.handleComplete()`, after marking a lesson complete, query remaining uncompleted lessons for that pupil
- If zero remain, prompt the instructor to mark the course as complete or auto-mark it

**Step 3: Trigger £50 bonus on course completion**
- When course status changes to `completed`, increment `instructors.bonus_earned` by 50
- Insert a record in `payment_history` as audit trail
- Show a celebratory toast/notification to the instructor

**Step 4: Show bonus status to instructor**
- The existing `MoneyActionGrid` already shows `bonusEarned` — this will automatically reflect the updated value

### Files to Modify
- `src/components/instructor/EndLessonWizard.tsx` — Add course completion check after last lesson
- `src/components/instructor/money/MoneyActionGrid.tsx` — Already shows bonus (no changes needed)
- Database migration — Add `course_status` column to `pupils` if needed
- Potentially a new component for explicit "Mark Course Complete" action

