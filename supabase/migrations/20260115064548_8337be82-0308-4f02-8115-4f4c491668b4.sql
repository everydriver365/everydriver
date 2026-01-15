-- Drop the existing permissive delete policy
DROP POLICY IF EXISTS "Anyone can delete instructors" ON public.instructors;

-- Create a new policy that only allows admins to delete instructors
CREATE POLICY "Admins can delete instructors" 
ON public.instructors 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also update the insert and update policies to be admin-only for better security
DROP POLICY IF EXISTS "Anyone can insert instructors" ON public.instructors;
DROP POLICY IF EXISTS "Anyone can update instructors" ON public.instructors;

CREATE POLICY "Admins can insert instructors" 
ON public.instructors 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update instructors" 
ON public.instructors 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also allow instructors to update their own profile
CREATE POLICY "Instructors can update own profile" 
ON public.instructors 
FOR UPDATE 
TO authenticated
USING (auth_user_id = auth.uid());