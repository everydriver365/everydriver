## Problem

On `/instructor/pupils/:pupilId` (PremiumPupilProfile), the "Last lesson" tile is empty for this pupil even though they have a completed lesson today.

Root cause: `usePupilLessonStats` (src/pages/PremiumPupilProfile.tsx ~L354) reads `lastLesson` only from `lesson_history`. That row is only written when EOL is fully completed. The pupil here has a `scheduled_lessons` row with `status='completed'` for today but no `lesson_history` entry yet, so the tile renders the "No previous lessons yet" empty state.

## Fix

Update `usePupilLessonStats` to compute `lastLesson` from whichever of the two sources is most recent:

1. Add a fourth query alongside the existing three:
   ```ts
   supabase
     .from("scheduled_lessons")
     .select("id, lesson_date, start_time, duration_minutes, pickup_postcode, lesson_type, status")
     .eq("pupil_id", pupilId!)
     .eq("status", "completed")
     .order("lesson_date", { ascending: false })
     .order("start_time", { ascending: false })
     .limit(1)
   ```
2. Pick the more recent of `lesson_history[0]` and the completed `scheduled_lessons[0]` (compare by `lesson_date`, then `start_time`) and return it as `lastLesson`. Tag the source so the UI can read the right optional fields.
3. Tile (L795–840) already conditionally renders `rating`, `skills_practiced`, and `notes`, so when the fallback row comes from `scheduled_lessons` it will show date + relative time correctly and just omit the missing fields. Add a small subtitle line for the scheduled-lessons fallback showing duration / postcode so the tile doesn't look bare.

## Out of scope

- No DB writes, no EOL flow changes, no RLS changes.
- No other tiles or pages.
