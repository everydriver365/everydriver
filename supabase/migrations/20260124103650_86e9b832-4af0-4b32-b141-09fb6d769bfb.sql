-- Fix: Add policy allowing users to create their own instructor profile during signup
CREATE POLICY "Users can insert own instructor profile"
ON public.instructors
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Create table to persist onboarding step configuration
CREATE TABLE public.onboarding_steps (
  id SERIAL PRIMARY KEY,
  step_number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can see onboarding step config)
CREATE POLICY "Onboarding steps are publicly viewable"
ON public.onboarding_steps
FOR SELECT
USING (true);

-- Only admins can modify onboarding steps
CREATE POLICY "Admins can update onboarding steps"
ON public.onboarding_steps
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert onboarding steps"
ON public.onboarding_steps
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete onboarding steps"
ON public.onboarding_steps
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default steps
INSERT INTO public.onboarding_steps (step_number, name, description, icon_name, is_enabled, is_required, display_order) VALUES
(1, 'Personal Details', 'Name, email, phone, bio, profile photo', 'User', true, true, 1),
(2, 'Location', 'Home postcode and coverage radius', 'MapPin', true, true, 2),
(3, 'Vehicle', 'Car type, make, and model', 'Car', true, false, 3),
(4, 'Qualifications', 'ADI grade, CPD certification, code of practice', 'GraduationCap', true, false, 4),
(5, 'Services', 'Hourly rate, lesson duration, service offerings', 'Briefcase', true, false, 5),
(6, 'Plan Selection', 'Subscription plan and billing cycle', 'CreditCard', true, true, 6),
(7, 'Website Setup', 'Theme, colors, and URL slug', 'Globe', true, false, 7),
(8, 'Complete', 'Success confirmation and next steps', 'PartyPopper', true, true, 8);

-- Create trigger for updated_at
CREATE TRIGGER update_onboarding_steps_updated_at
BEFORE UPDATE ON public.onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();