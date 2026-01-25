-- Add metadata column to saved_routes for storing additional test details
ALTER TABLE public.saved_routes
ADD COLUMN IF NOT EXISTS metadata JSONB;