-- Add auth_user_id column to instructors
ALTER TABLE public.instructors 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Create unique index
CREATE UNIQUE INDEX instructors_auth_user_id_unique_idx 
ON public.instructors(auth_user_id) 
WHERE auth_user_id IS NOT NULL;