

## Fix: Enrich Morning Briefing with Per-Pupil Lesson Plans

### Problem
The AI briefing receives no per-pupil context (lesson plans, notes). It only gets aggregate stats, so when it mentions things like "practice parallel parking" it's either hallucinating or has no way to attribute it to a specific pupil — making it unhelpful.

### Solution
Feed each today's lesson with the pupil name, time, and their `next_lesson_plan` from `lesson_history` into the AI context so the briefing can say *"Sarah at 10am — work on parallel parking"* instead of vague tips.

### Changes — `supabase/functions/generate-morning-briefing/index.ts`

1. **Fetch last lesson plan per pupil**: After fetching today's lessons, for each lesson's `pupil_id`, query `lesson_history` for the most recent `next_lesson_plan` (same pattern as `useNextLessonDetails.ts`).

2. **Enrich context object**: Replace the flat `firstTime`/`firstPupil` fields with a `todayLessons` array:
   ```
   todayLessons: [
     { time: "09:00", pupilName: "Sarah", plan: "Practice parallel parking" },
     { time: "11:00", pupilName: "James", plan: null },
   ]
   ```

3. **Update AI system prompt**: Tell the AI to reference specific pupils and their plans when mentioning lesson focus areas, and to NOT invent lesson content when no plan exists.

   Add to system prompt: `"For each lesson, mention the pupil's name and time. If a lesson plan exists, briefly mention the focus. Do NOT invent or guess lesson content when no plan is provided."`

No database changes needed. Single file edit.

