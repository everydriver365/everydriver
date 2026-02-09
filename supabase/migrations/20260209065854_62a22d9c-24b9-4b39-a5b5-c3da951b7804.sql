
-- Add appearance columns to instructor_tile_preferences
ALTER TABLE public.instructor_tile_preferences
  ADD COLUMN IF NOT EXISTS home_layout_style TEXT NOT NULL DEFAULT 'dashboard',
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallpaper_color TEXT DEFAULT NULL;

-- Create hero-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can view hero images (public bucket)
CREATE POLICY "Hero images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

-- RLS: Instructors can upload their own hero images (folder = instructor_id)
CREATE POLICY "Instructors can upload their own hero images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images'
  AND auth.uid() IS NOT NULL
);

-- RLS: Instructors can update their own hero images
CREATE POLICY "Instructors can update their own hero images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-images'
  AND auth.uid() IS NOT NULL
);

-- RLS: Instructors can delete their own hero images
CREATE POLICY "Instructors can delete their own hero images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-images'
  AND auth.uid() IS NOT NULL
);
