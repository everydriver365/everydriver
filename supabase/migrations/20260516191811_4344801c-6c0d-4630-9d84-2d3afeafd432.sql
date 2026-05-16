-- Backfill availability_windows from instructor_working_hours where missing
-- iwh dow: 0=Sun..6=Sat. aw dow: 1=Mon..7=Sun (Sun stored as 7).
INSERT INTO public.availability_windows (instructor_id, day_of_week, start_time, end_time, is_active)
SELECT
  iwh.instructor_id,
  CASE WHEN iwh.day_of_week = 0 THEN 7 ELSE iwh.day_of_week END AS dow,
  iwh.start_time,
  iwh.end_time,
  true
FROM public.instructor_working_hours iwh
WHERE iwh.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.availability_windows aw
    WHERE aw.instructor_id = iwh.instructor_id
      AND aw.day_of_week = CASE WHEN iwh.day_of_week = 0 THEN 7 ELSE iwh.day_of_week END
      AND aw.start_time = iwh.start_time
      AND aw.end_time = iwh.end_time
  );

-- Backfill instructor_working_hours from availability_windows where the
-- instructor has aw rows but no iwh rows at all (don't overwrite richer iwh).
WITH instructors_without_iwh AS (
  SELECT DISTINCT aw.instructor_id
  FROM public.availability_windows aw
  WHERE aw.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.instructor_working_hours iwh
      WHERE iwh.instructor_id = aw.instructor_id
    )
),
collapsed AS (
  SELECT
    aw.instructor_id,
    CASE WHEN aw.day_of_week = 7 THEN 0 ELSE aw.day_of_week END AS dow,
    MIN(aw.start_time) AS start_time,
    MAX(aw.end_time) AS end_time
  FROM public.availability_windows aw
  JOIN instructors_without_iwh i ON i.instructor_id = aw.instructor_id
  WHERE aw.is_active = true
  GROUP BY aw.instructor_id, CASE WHEN aw.day_of_week = 7 THEN 0 ELSE aw.day_of_week END
)
INSERT INTO public.instructor_working_hours (instructor_id, day_of_week, start_time, end_time, is_active)
SELECT instructor_id, dow, start_time, end_time, true FROM collapsed
ON CONFLICT (instructor_id, day_of_week) DO NOTHING;