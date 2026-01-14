-- Add what3words column to pupils table
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS what3words TEXT;

-- Add pickup_what3words to scheduled_lessons for pickup addresses
ALTER TABLE public.scheduled_lessons ADD COLUMN IF NOT EXISTS pickup_what3words TEXT;