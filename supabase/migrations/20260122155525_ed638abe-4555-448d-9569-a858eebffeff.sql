-- Add columns to track dismissed/false positive events
ALTER TABLE public.driving_behavior_events 
ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dismissed_reason TEXT,
ADD COLUMN IF NOT EXISTS dismissed_by UUID REFERENCES auth.users(id);

-- Add index for faster filtering of non-dismissed events
CREATE INDEX IF NOT EXISTS idx_driving_behavior_events_dismissed 
ON public.driving_behavior_events(telematics_id, is_dismissed) 
WHERE is_dismissed = false;