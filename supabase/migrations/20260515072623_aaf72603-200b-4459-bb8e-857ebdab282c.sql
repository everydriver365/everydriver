-- Add instructor_id to pupil_swap_checklist and switch to instructor-based RLS
-- (Table is brand new, no data to migrate)

-- Add instructor_id referencing instructors
ALTER TABLE public.pupil_swap_checklist 
ADD COLUMN instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE;

-- Drop old pupil-based policies (they don't work for pupil-portal auth)
DROP POLICY IF EXISTS "Pupils can view their own checklist" ON public.pupil_swap_checklist;
DROP POLICY IF EXISTS "Pupils can update their own checklist" ON public.pupil_swap_checklist;
DROP POLICY IF EXISTS "Pupils can insert their own checklist" ON public.pupil_swap_checklist;
DROP POLICY IF EXISTS "Pupils can delete their own checklist" ON public.pupil_swap_checklist;

-- Instructor-based policies (same pattern as pupil_swap_profile)
CREATE POLICY "Instructor can manage their pupils' checklists"
ON public.pupil_swap_checklist
FOR ALL
TO public
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));
