-- Add booking mode column to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS booking_mode text DEFAULT 'pupil_choice';

-- Add comment for clarity
COMMENT ON COLUMN public.instructors.booking_mode IS 'How pupils book lessons: pupil_choice (select slots), auto_assign (system finds optimal slots), instructor_assigns (instructor schedules manually)';

-- Add pupil preference columns for auto-assign logic
ALTER TABLE public.pupils
ADD COLUMN IF NOT EXISTS preferred_times text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_days text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scheduling_status text DEFAULT 'scheduled';

-- Add comment for clarity
COMMENT ON COLUMN public.pupils.scheduling_status IS 'For instructor_assigns mode: pending_schedule, scheduled';