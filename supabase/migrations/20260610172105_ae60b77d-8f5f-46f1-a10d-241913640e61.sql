
-- Drop overly permissive storage policies; keep path-scoped ones
DROP POLICY IF EXISTS "Instructors can delete their own hero images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can update their own hero images" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can upload their own hero images" ON storage.objects;
DROP POLICY IF EXISTS "Pupils can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Pupils can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Pupils can upload their own avatar" ON storage.objects;

-- Lock down realtime.messages: only authenticated users, and only for channels they own/auth via topic checks.
-- Without an app-level topic scheme, deny by default. Server (service_role) bypasses RLS.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users deny by default" ON realtime.messages;
CREATE POLICY "Authenticated users deny by default"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (false);
