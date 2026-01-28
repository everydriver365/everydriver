-- Add is_shared column to syllabus_templates if it doesn't exist
ALTER TABLE public.syllabus_templates 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Update RLS policy for syllabus_templates
DROP POLICY IF EXISTS "Instructors can view shared templates" ON public.syllabus_templates;
CREATE POLICY "Instructors can view shared templates"
ON public.syllabus_templates FOR SELECT
USING (is_shared = true OR instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Add emergency contact and custom rate fields to pupils
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
ADD COLUMN IF NOT EXISTS custom_hourly_rate NUMERIC(10,2);