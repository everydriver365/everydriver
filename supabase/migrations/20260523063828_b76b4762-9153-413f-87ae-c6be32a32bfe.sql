CREATE UNIQUE INDEX IF NOT EXISTS mileage_logs_commute_unique
ON public.mileage_logs (instructor_id, log_date, purpose)
WHERE telematics_id IS NULL
  AND purpose IN ('Home to first lesson', 'Last lesson to home');