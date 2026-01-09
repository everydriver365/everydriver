-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to course videos
CREATE POLICY "Course videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-videos');

-- Allow authenticated users to upload course videos (for admin)
CREATE POLICY "Anyone can upload course videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-videos');

-- Allow authenticated users to update course videos
CREATE POLICY "Anyone can update course videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-videos');

-- Allow authenticated users to delete course videos
CREATE POLICY "Anyone can delete course videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-videos');