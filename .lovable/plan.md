

# Instructor Mobile Home Enhancements + DVSA Syllabus Comments

## Overview
This plan covers 10 improvements to the instructor mobile homepage and the DVSA lesson syllabus system. The changes span GUI refinements, new functional widgets, and a per-competency comments system for the post-lesson review.

---

## 1. Merge Messages and Job Offers into Single iOS-Grouped Card (Default Layout)

Currently, Messages and Job Offers are separate gradient-styled cards in the default layout. We will merge them into a single `bg-card rounded-2xl` grouped card (like the clean layout already does), with divider lines between rows.

**File**: `src/components/instructor/InstructorMobileHome.tsx`
- Replace the separate Job Offers gradient card (lines 558-583) and Messages gradient card (lines 616-642) with a single iOS-grouped card containing both rows, matching the pattern used in `CleanHomeView.tsx` (lines 228-256).

---

## 2. Add Weekly Progress Ring to Hero Area

Surface the existing `useWeeklyGoals` hook data as a compact progress ring in the hero overlay, showing hours taught vs weekly goal.

**File**: `src/components/instructor/InstructorMobileHome.tsx`
- In the hero section (around line 397), add the `WeeklyGoalRing` component (already imported) next to or replacing the existing lesson count ring, using `weeklyGoals` data that is already fetched.

---

## 3. Sticky Header "Next Up" Bar on Scroll

Add a compact sticky bar that appears when the user scrolls past the Next Up tile, showing the next pupil name and countdown.

**File**: `src/components/instructor/InstructorMobileHome.tsx`
- Add a `position: sticky` bar at the top of the scrollable content that shows `nextLesson.pupilName` and `nextLesson.minutesUntil` when `showFAB` is true (scroll > 200px), using `AnimatePresence` for smooth entry/exit.

---

## 4. Style Standardisation

Ensure all cards in the default layout use `rounded-2xl` consistently and unify section header typography.

**File**: `src/components/instructor/InstructorMobileHome.tsx`
- Audit and update card classes: replace `rounded-none` with `rounded-2xl` on Today's Overview, Job Offers, Messages, Tomorrow Peek, and lesson cards.
- Standardise section headers to use the same `text-[13px] font-semibold text-muted-foreground uppercase tracking-wide` style used in the clean layout.

---

## 5. Quick-Start "Start Next Lesson" Button

Add a prominent "Start Lesson" button on the Next Up tile that navigates to the lesson tracking/GPS session.

**File**: `src/components/instructor/NextUpTile.tsx`
- Add a "Start Lesson" button (Play icon + label) that navigates to `/instructor/live-map?lesson={lessonId}` or triggers session start, visible when `minutesUntil <= 15`.

---

## 6. Surface Last Week Earnings Comparison

Show a small up/down indicator with percentage change near the Today's Overview earnings figure.

**File**: `src/components/instructor/InstructorMobileHome.tsx`
- Near the earnings display in the hero card (around line 456), add an inline badge showing `lastWeekComparison` data (already fetched) with an arrow icon and percentage.

---

## 7. Surface Gap-Filler Suggestions

Show a dismissible card when `useRealGapSlots` detects available gaps in the schedule.

**File**: `src/components/instructor/InstructorMobileHome.tsx`
- After the "YOUR DAY" section, conditionally render the existing `GapFillerCard` component (already imported at line 69) when `gapSuggestions` has entries, using the gap data from the `useRealGapSlots` hook.

---

## 8. Add Per-Competency Comments to Post-Lesson Review

Enhance the PostLessonReview to allow instructors to add a short comment/note per competency when marking levels. This uses the existing `instructor_notes` column in `pupil_syllabus_progress`.

**File**: `src/components/instructor/PostLessonReview.tsx`
- Add a `comments` state object: `Record<string, string>`.
- Fetch existing `instructor_notes` alongside progress levels.
- Below each competency's level buttons, add a small expandable text input that appears when the competency row is tapped/expanded.
- On save, include `instructor_notes` in the upsert payload to `pupil_syllabus_progress`.
- Also add a `comment` column to `lesson_syllabus_updates` via migration so each level change can have an associated note for audit purposes.

**Database Migration**:
```sql
ALTER TABLE lesson_syllabus_updates 
ADD COLUMN comment text;
```

---

## 9. Complete DVSA Syllabus Marking UX

Improve the competency grid in PostLessonReview to be more complete and usable:

**File**: `src/components/instructor/PostLessonReview.tsx`
- Auto-expand categories that contain skills from `skillsPracticed` (already partially done).
- Add a "Select All in Category" toggle for bulk level-setting.
- Show the competency description as a subtitle under each name.
- Add colour-coded level labels (not just numbers) so instructors can see "Introduced", "Under Guidance", etc.
- Add a summary bar at the top showing total changes and overall progress percentage.

---

## 10. Show Per-Competency Comments in Pupil Syllabus View

**File**: `src/components/pupil-portal/PupilSyllabusView.tsx`
- Fetch `instructor_notes` from `pupil_syllabus_progress`.
- Display notes as a small italic line below each competency in the expanded category view.

**File**: `src/components/instructor/SyllabusRecommendations.tsx`
- Show latest instructor notes in tooltip or small text when hovering/tapping competency badges.

---

## Technical Summary

| Area | Files Changed | DB Changes |
|------|--------------|------------|
| Merged notifications card | InstructorMobileHome.tsx | None |
| Weekly progress ring | InstructorMobileHome.tsx | None |
| Sticky next-up bar | InstructorMobileHome.tsx | None |
| Style standardisation | InstructorMobileHome.tsx | None |
| Quick-start button | NextUpTile.tsx | None |
| Earnings comparison | InstructorMobileHome.tsx | None |
| Gap-filler card | InstructorMobileHome.tsx | None |
| Per-competency comments | PostLessonReview.tsx | Add `comment` column to `lesson_syllabus_updates` |
| Syllabus marking UX | PostLessonReview.tsx | None |
| Show comments in views | PupilSyllabusView.tsx, SyllabusRecommendations.tsx | None |

