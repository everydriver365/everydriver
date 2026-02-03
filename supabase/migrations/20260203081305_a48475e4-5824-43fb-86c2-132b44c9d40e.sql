-- Add GPSgate tracking columns to instructors table
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS gpsgate_user_id INTEGER,
ADD COLUMN IF NOT EXISTS gpsgate_username TEXT;

-- Add index for fast lookup by GPSgate User ID
CREATE INDEX IF NOT EXISTS idx_instructors_gpsgate_user_id 
ON public.instructors(gpsgate_user_id) 
WHERE gpsgate_user_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.instructors.gpsgate_user_id IS 'GPSgate User ID for instructor phone tracking via GPSgate Tracker app';
COMMENT ON COLUMN public.instructors.gpsgate_username IS 'GPSgate username for display reference';