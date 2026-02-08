

# Lesson Review and Planning System

## Overview
Build a "Post-Lesson Review" workflow that ties each completed lesson to the DVSA syllabus, enabling instructors to quickly update competency levels after every lesson and plan what to cover next. Pupils see the review in their portal and can add their own reflections.

## How It Works

### For Instructors: Post-Lesson Debrief
When a lesson is completed (or manually triggered), the instructor gets a streamlined review screen:

1. **Competency Quick-Update** -- A compact grid of the 27 DVSA syllabus items. Only the skills relevant to that lesson are pre-selected (based on the `skills_practiced` field in `lesson_history`). The instructor taps to adjust each skill's level (0-5) without opening the full syllabus.

2. **Lesson Notes + Next Plan** -- Two text fields:
   - "How did it go?" (saved to `lesson_history.notes`)
   - "Plan for next lesson" (new field: `next_lesson_plan`)

3. **Save** -- Upserts the updated levels into `pupil_syllabus_progress` and saves the lesson record, all in one action.

### For Pupils: Review + Reflect
In the pupil portal, each past lesson shows:
- The instructor's notes and skill-level changes
- A "Reflect" button linking to the existing Reflective Log (pre-filled with the lesson ID)
- The instructor's plan for the next lesson, so the pupil knows what to prepare for

### Entry Points
- **After logging a lesson**: The "Log Lesson" dialog gains a "Review Skills" step before final save.
- **From lesson history**: An "Add Review" button on any past lesson card.
- **From the schedule**: When a lesson's status changes to "completed", a prompt appears.

## Database Changes

A single new column on `lesson_history`:

| Column | Type | Purpose |
|--------|------|---------|
| `next_lesson_plan` | TEXT, nullable | Instructor's plan for what to cover next |

A new linking table to record which competencies were updated during each lesson review:

| Table: `lesson_syllabus_updates` | | |
|---|---|---|
| `id` | UUID PK | |
| `lesson_history_id` | UUID FK -> lesson_history | Links to the lesson |
| `pupil_id` | UUID FK -> pupils | For quick queries |
| `competency_id` | TEXT | DVSA syllabus item ID |
| `previous_level` | INTEGER | Level before this lesson |
| `new_level` | INTEGER | Level after this lesson |
| `created_at` | TIMESTAMPTZ | |

This gives a full audit trail of skill progression per lesson.

## Technical Implementation

### 1. Database Migration
- Add `next_lesson_plan TEXT` to `lesson_history`
- Create `lesson_syllabus_updates` table with RLS policies (instructor can insert/read their own pupils' records; pupil can read their own)

### 2. New Component: `PostLessonReview.tsx`
- Receives `lessonId`, `pupilId`, `instructorId`
- Fetches current `pupil_syllabus_progress` for all 27 competencies
- Shows a compact card per category with tappable level buttons (only for skills practiced)
- "Next Lesson Plan" textarea
- On save: batch upserts to `pupil_syllabus_progress`, inserts delta records to `lesson_syllabus_updates`, updates `lesson_history.next_lesson_plan`

### 3. Integration Points
- **LessonHistory.tsx**: Add a "Review" button on each lesson card that opens `PostLessonReview` in a sheet/dialog
- **AddLessonSheet / Log Lesson flow**: Add an optional "Review Skills" step after filling in lesson details
- **ExpandablePupilCard.tsx**: No changes needed (syllabus already accessible)

### 4. Pupil Portal Updates
- **PupilSyllabusView.tsx**: Add a "Recent Changes" section showing the last few `lesson_syllabus_updates` with dates
- **ReflectiveLog.tsx**: Already linked via `lesson_history_id` -- no changes needed
- Show the instructor's `next_lesson_plan` on the pupil's upcoming lesson card or in a "Preparing for Next Lesson" section

### 5. Files to Create/Modify
- **Create**: `src/components/instructor/PostLessonReview.tsx`
- **Modify**: `src/components/instructor/LessonHistory.tsx` (add Review button)
- **Modify**: `src/components/pupil-portal/PupilSyllabusView.tsx` (add recent skill changes)
- **Modify**: `src/pages/PupilPortal.tsx` (show next lesson plan)
- **Migration**: New SQL migration for the table and column

