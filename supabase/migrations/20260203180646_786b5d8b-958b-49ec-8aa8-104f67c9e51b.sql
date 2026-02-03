-- Create storage bucket for pupil profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('pupil-avatars', 'pupil-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view pupil avatars (public bucket)
CREATE POLICY "Anyone can view pupil avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'pupil-avatars');

-- Allow pupils to upload their own avatar (using pupil ID in path)
CREATE POLICY "Pupils can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pupil-avatars');

-- Allow pupils to update their own avatar
CREATE POLICY "Pupils can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pupil-avatars');

-- Allow pupils to delete their own avatar  
CREATE POLICY "Pupils can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'pupil-avatars');