-- Add compliance tracking columns to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS adi_badge_number TEXT,
ADD COLUMN IF NOT EXISTS adi_badge_expiry DATE,
ADD COLUMN IF NOT EXISTS car_insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS car_mot_expiry DATE,
ADD COLUMN IF NOT EXISTS car_tax_expiry DATE,
ADD COLUMN IF NOT EXISTS cpd_hours_logged NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpd_year_target NUMERIC DEFAULT 35,
ADD COLUMN IF NOT EXISTS dbs_certificate_expiry DATE,
ADD COLUMN IF NOT EXISTS last_compliance_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Create CPD log entries table for detailed tracking
CREATE TABLE IF NOT EXISTS public.cpd_log_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  certificate_url TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cpd_log_entries
ALTER TABLE public.cpd_log_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for CPD log
CREATE POLICY "Instructors can view own CPD entries" 
ON public.cpd_log_entries 
FOR SELECT 
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can insert own CPD entries" 
ON public.cpd_log_entries 
FOR INSERT 
WITH CHECK (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update own CPD entries" 
ON public.cpd_log_entries 
FOR UPDATE 
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete own CPD entries" 
ON public.cpd_log_entries 
FOR DELETE 
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Create compliance_reminders table to track sent reminders
CREATE TABLE IF NOT EXISTS public.compliance_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_via TEXT NOT NULL
);

-- Enable RLS on compliance_reminders
ALTER TABLE public.compliance_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policy - instructors can view their own reminders
CREATE POLICY "Instructors can view own compliance reminders" 
ON public.compliance_reminders 
FOR SELECT 
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);