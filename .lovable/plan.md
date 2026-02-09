

# Deeper DVSA Syllabus Integration: Lessons, Tracking, and AI Lesson Planning

## What Already Exists

Your platform already has solid foundations:

- **27 DVSA competencies** defined with 6 skill levels (0-5)
- **Pupil syllabus progress** tracking in `pupil_syllabus_progress` table
- **Post-lesson review** that lets instructors update competency levels and write notes
- **Lesson syllabus updates** audit trail linking skill changes to specific lessons
- **Radar chart** visualization of progress by category
- **AI driving insights** based on telematics data (speed, braking, acceleration)
- **Coaching messages** sent to pupils based on trip performance
- **Next lesson plan** free-text field on lesson_history

## What's Missing (The Gaps)

1. **No syllabus link on scheduled lessons** -- you can't tag upcoming lessons with which competencies will be practiced
2. **AI insights ignore syllabus data** -- the `generate-driving-insights` function only looks at telematics, not skill levels or lesson history
3. **AI doesn't generate lesson plans** -- the "Plan for next lesson" field is manually written with no AI assistance
4. **No "recommended next skills" logic** -- the system doesn't suggest what to teach next based on current progress
5. **Telematics alerts aren't mapped to syllabus competencies** -- harsh braking events aren't connected to "Use of Speed" or "Following Distance" competencies

---

## Implementation Plan

### Phase 1: Tag Scheduled Lessons with Syllabus Skills

**Database change:**
- Add `planned_competencies text[]` column to `scheduled_lessons` table

**UI changes:**
- Add a competency picker to the lesson scheduling flow -- a quick multi-select of DVSA skills the instructor plans to cover
- Show planned skills on the lesson card/detail view
- Pre-populate the post-lesson review with these planned competencies (auto-expand those categories)

### Phase 2: AI Lesson Plan Generator

**New backend function: `generate-lesson-plan`**

This function will:
1. Fetch the pupil's current syllabus progress (all 27 competencies + levels)
2. Fetch recent lesson history (last 5-10 lessons with notes, skills practiced, ratings)
3. Fetch recent telematics data (speeding, braking, distance)
4. Fetch the lesson_syllabus_updates audit trail (progression trends)
5. Send all this context to AI (Gemini 2.5 Flash) with a prompt like:

```
You are a DVSA-qualified driving instructor AI. Based on this pupil's current
syllabus progress, recent lesson history, and telematics data, suggest a lesson
plan for their next session.

Consider:
- Skills at level 0-1 that haven't been introduced yet
- Skills at level 2-3 that need more practice
- Skills that were recently downgraded
- Any telematics issues (harsh braking = work on "Following Distance")
- Logical skill progression (e.g., don't teach roundabouts before junctions)

Return JSON with:
- recommended_competencies: string[] (3-5 skill IDs to focus on)
- lesson_structure: string (e.g., "30 min residential, 20 min dual carriageway, 10 min manoeuvres")
- key_focus: string (the main thing to work on)
- reasoning: string (why these skills were chosen)
- estimated_duration: number (recommended lesson length in minutes)
```

**UI: "Suggest Plan" button**
- Add a sparkle/AI button next to the "Plan for next lesson" textarea in PostLessonReview
- When tapped, calls the function and populates the textarea with the AI suggestion
- Instructor can edit before saving
- Also available when scheduling a new lesson

### Phase 3: Enhance AI Insights with Syllabus Context

**Update `generate-driving-insights` function:**
- Add syllabus progress data to the AI prompt
- Map telematics events to specific competencies:
  - Harsh braking --> "Following Distance", "Awareness & Planning"
  - Speeding --> "Use of Speed", "Response to Signs & Signals"
  - Harsh acceleration --> "Controls & Instruments", "Moving Off"
- Include competency progression trends in the analysis
- AI can now say "Your 'Use of Speed' is at Level 2 and your telematics show 15% speeding -- focus on this next lesson"

### Phase 4: Smart Competency Recommendations

**New component: `SyllabusRecommendations`**
- Shows on the pupil card alongside the existing syllabus view
- Algorithmic (no AI needed) suggestions:
  - "Ready to progress" -- skills at current level for 3+ lessons with good telematics
  - "Needs attention" -- skills that were recently downgraded or have stalled
  - "Not yet started" -- skills at level 0, ordered by logical progression
  - "Test ready" -- skills at level 5, highlighting gaps preventing test readiness
- Progress towards "test ready" percentage (all skills at level 4+)

### Phase 5: Connect Telematics Alerts to Competencies

**Database change:**
- Add `related_competency_id text` column to `telematics_alerts` table

**Logic update in `check_gps_point_alerts` trigger:**
- Automatically tag alerts with the relevant DVSA competency:
  - `speeding` --> `use_of_speed`
  - `harsh_brake` --> `following_distance`
  - `harsh_accel` --> `moving_off`
  - `sharp_turn` --> `positioning`

This enables the AI and the pupil portal to show "You had 3 speeding alerts -- this relates to your 'Use of Speed' skill which is currently at Level 2."

---

## Technical Details

### New Database Migration

```sql
-- Add planned competencies to scheduled lessons
ALTER TABLE scheduled_lessons ADD COLUMN planned_competencies text[];

-- Add competency link to telematics alerts
ALTER TABLE telematics_alerts ADD COLUMN related_competency_id text;
```

### New Edge Function: `generate-lesson-plan`

- Input: `{ pupilId, instructorId }`
- Fetches: syllabus progress, lesson history (last 10), telematics (last 5), syllabus update audit trail
- Calls: Lovable AI (Gemini 2.5 Flash) with structured prompt
- Returns: `{ recommended_competencies, lesson_structure, key_focus, reasoning, estimated_duration }`

### Modified Edge Function: `generate-driving-insights`

- Additionally fetches `pupil_syllabus_progress` for the pupil
- Adds syllabus context to the AI prompt
- Maps telematics patterns to competency recommendations

### UI Components Modified

- `PostLessonReview.tsx` -- Add "AI Suggest" button for next lesson plan
- `ExpandablePupilCard.tsx` -- Add recommendations section
- Lesson scheduling dialog -- Add competency picker

### New UI Components

- `SyllabusRecommendations.tsx` -- Smart skill recommendations panel
- `CompetencyPicker.tsx` -- Multi-select for planned skills on lessons

---

## Summary of Changes

| Item | Type | Effort |
|------|------|--------|
| `planned_competencies` column on scheduled_lessons | DB migration | Small |
| `related_competency_id` column on telematics_alerts | DB migration | Small |
| `generate-lesson-plan` edge function | New backend function | Medium |
| Update `generate-driving-insights` with syllabus | Modify backend function | Medium |
| "AI Suggest" button on PostLessonReview | UI change | Small |
| CompetencyPicker for lesson scheduling | New component | Medium |
| SyllabusRecommendations panel | New component | Medium |
| Update telematics alert trigger | DB trigger update | Small |

