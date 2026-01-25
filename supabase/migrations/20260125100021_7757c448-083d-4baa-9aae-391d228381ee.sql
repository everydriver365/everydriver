-- Add test route mode flag to traccar_devices table
ALTER TABLE public.traccar_devices
ADD COLUMN IF NOT EXISTS is_test_route_mode BOOLEAN NOT NULL DEFAULT false;

-- Add test_centre_id to saved_routes if missing
ALTER TABLE public.saved_routes
ADD COLUMN IF NOT EXISTS test_centre_id UUID REFERENCES public.test_centres(id) ON DELETE SET NULL;

-- Add route_path column for storing GPS coordinates
ALTER TABLE public.saved_routes
ADD COLUMN IF NOT EXISTS route_path JSONB;

-- Add duration and speed columns if missing
ALTER TABLE public.saved_routes
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS avg_speed_kmh NUMERIC,
ADD COLUMN IF NOT EXISTS max_speed_kmh NUMERIC;

-- Create index for test centre lookups
CREATE INDEX IF NOT EXISTS idx_saved_routes_test_centre ON public.saved_routes(test_centre_id);