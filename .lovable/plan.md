

## Lesson Completion Summary — Apple Fitness Style

### What We're Building
When a lesson is marked complete via the `EndLessonWizard`, instead of immediately closing, show a rich **Apple Fitness-style summary sheet** (dark card aesthetic from the reference image) with telematics data from the linked GPS tracking session.

### How It Works

**Data Flow:**
1. When the wizard's `handleComplete` runs, after marking the lesson complete, query `lesson_telematics` for a matching session (same `pupil_id` + `instructor_id`, overlapping time window around the lesson's scheduled time)
2. If a telematics session is found, call the existing `generate-route-report` edge function with that `telematicsId` to get the full route report (roads, speeds, events, segments)
3. Show a new `StepLessonSummary` component instead of the brief "Lesson completed!" spinner screen

**New Component: `src/components/instructor/end-lesson/StepLessonSummary.tsx`**

An Apple Fitness Workout Summary-style card with dark background (`bg-[#1C1C1E]`) containing:
- **Header**: Car icon in a green circle, lesson type label, start–end time, location
- **Details Grid** (2-column, colored values like the reference):
  - Duration (green) | Distance in miles (cyan)
  - Avg Speed (yellow) | Max Speed (red/pink)
- **Roads Travelled**: List of road names with speed limits (collapsible if >5)
- **Safety Events**: Overspeeding count, harsh braking count, harsh acceleration count
- **Competencies Covered**: List of DVSA skills updated during the StepSkills phase (passed through state)
- **Manoeuvres**: Any manoeuvres tagged in the lesson notes or skills step
- A "Done" button at the bottom to close

**Changes to `EndLessonWizard.tsx`:**
- Add a new wizard step `"completed"` after `"completing"`
- In `handleComplete`, after all DB operations succeed, attempt to find a matching `lesson_telematics` session and fetch its report data
- If telematics data exists, transition to the `"completed"` step showing `StepLessonSummary`
- If no telematics data, show a simpler summary with just duration, cost, and notes (graceful fallback)

**Changes to `StepSummary.tsx`:**
- No changes needed — this is the pre-completion summary step

### Files Modified
1. **`src/components/instructor/end-lesson/StepLessonSummary.tsx`** — New component (Apple Fitness-style summary)
2. **`src/components/instructor/EndLessonWizard.tsx`** — Add `"completed"` step, fetch telematics data after completion, render `StepLessonSummary`

### No Database Changes
All data already exists in `lesson_telematics`, `gps_points`, and the `generate-route-report` edge function. We just need to query and display it.

