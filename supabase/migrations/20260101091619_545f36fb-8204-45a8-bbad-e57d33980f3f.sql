-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert instructors" ON public.instructors;
DROP POLICY IF EXISTS "Authenticated users can update instructors" ON public.instructors;
DROP POLICY IF EXISTS "Authenticated users can delete instructors" ON public.instructors;

-- Create permissive policies for anonymous access (admin portal without auth)
CREATE POLICY "Anyone can insert instructors" 
ON public.instructors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update instructors" 
ON public.instructors 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete instructors" 
ON public.instructors 
FOR DELETE 
USING (true);

-- Update storage policies for anonymous access
DROP POLICY IF EXISTS "Authenticated users can upload instructor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update instructor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete instructor images" ON storage.objects;

CREATE POLICY "Anyone can upload instructor images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'instructor-images');

CREATE POLICY "Anyone can update instructor images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'instructor-images');

CREATE POLICY "Anyone can delete instructor images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'instructor-images');