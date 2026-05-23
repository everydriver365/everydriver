-- PART 1: drop duplicate trigger, keep trg_auto_log_mileage
DROP TRIGGER IF EXISTS trigger_auto_log_mileage ON public.lesson_telematics;

-- PART 3: delete duplicate auto rows, keep earliest per telematics_id (by created_at, then id text)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY telematics_id
           ORDER BY created_at ASC, id::text ASC
         ) AS rn
  FROM public.mileage_logs
  WHERE telematics_id IS NOT NULL
)
DELETE FROM public.mileage_logs
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- PART 2: add unique constraint to prevent future duplicates
ALTER TABLE public.mileage_logs
ADD CONSTRAINT mileage_logs_telematics_id_unique UNIQUE (telematics_id);