

## Add "Driving Test" as a Lesson Type in AddLessonSheet

### What Changes

**1. Add lesson type selector to `AddLessonSheet.tsx`**
- Add a "Lesson Type" dropdown at the top of both the Existing and New Pupil tabs, defaulting to "Standard"
- Include all existing types plus new **"Driving Test"** option
- When "Driving Test" is selected:
  - Show test centre selector (fetched from `instructor_test_centres` + `test_centres`, same pattern as `DrivingTestStartDialog`)
  - Show examiner selector (fetched from `examiners` table)
  - Auto-set duration to 1 hour (typical test slot)
  - Hide recurring lesson option (tests aren't recurring)
  - Hide competency picker (not relevant for tests)
- Store the `lesson_type` as `"driving_test"` in the `scheduled_lessons` insert
- Store test centre and examiner info in the `notes` field as structured text (e.g. "Test Centre: Blyth | Examiner: John Smith") — avoids needing new columns

**2. Add "Driving Test" to display labels and colors**
- Update `courseTypeLabels` in `NewMobileScheduleView.tsx` (and other schedule views that define it): add `driving_test: "Driving Test"`
- Add color entry: red/orange theme to make it visually prominent on the schedule

**3. Show test day checklist when creating a driving test lesson**
- After selecting "Driving Test" type, show an expandable "Test Day Checklist" section in the form with key items:
  - Provisional licence
  - Theory test certificate
  - Glasses/contact lenses (if needed)
  - Car insurance & MOT documents
  - Correct mirrors and L plates fitted
- This is a visual reminder for the instructor, not persisted

**4. Send a reminder notification to the pupil**
- When a driving test lesson is saved, trigger a push notification and/or SMS to the pupil with a test day reminder message including:
  - Test date, time, and centre name
  - Checklist items to bring
- Leverage the existing `send-lesson-reminders` edge function pattern — the daily cron already sends reminders for next-day lessons. Add logic to include extra test checklist content when `lesson_type = 'driving_test'`

### Files to Modify
- `src/components/instructor/AddLessonSheet.tsx` — Add lesson type selector, conditional driving test fields (test centre, examiner, checklist)
- `src/components/instructor/NewMobileScheduleView.tsx` — Add `driving_test` to `courseTypeLabels` and `lessonTypeColors`
- `src/components/instructor/ExpandableLessonCard.tsx` — Add `driving_test` label/color if it has its own map
- `src/components/instructor/PupilCardStack.tsx` — Add `driving_test` to label/color maps
- `supabase/functions/send-lesson-reminders/index.ts` — Enhance reminder content for driving test lessons with checklist items

### No Database Migration Needed
- `lesson_type` is already a free-text `string` column — we just store `"driving_test"`
- Test centre/examiner details stored in existing `notes` field

