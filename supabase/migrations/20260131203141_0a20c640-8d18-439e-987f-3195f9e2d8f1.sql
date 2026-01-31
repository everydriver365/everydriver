-- Add hidden_tiles column to instructor_tile_preferences
ALTER TABLE public.instructor_tile_preferences 
ADD COLUMN IF NOT EXISTS hidden_tiles JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.instructor_tile_preferences.hidden_tiles 
IS 'Array of tile IDs that the instructor has hidden from their dashboard';