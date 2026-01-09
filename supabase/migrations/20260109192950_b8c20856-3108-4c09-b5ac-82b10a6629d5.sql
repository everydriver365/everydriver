-- Add detailed_content column to homepage_features for modal popup content
ALTER TABLE public.homepage_features 
ADD COLUMN detailed_content TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN public.homepage_features.detailed_content IS 'Extended description shown in modal popup when feature is clicked';