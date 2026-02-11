
CREATE TABLE IF NOT EXISTS public.plan_feature_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  short_description text DEFAULT '',
  long_description text DEFAULT '',
  icon_name text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.plan_feature_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view feature descriptions"
  ON public.plan_feature_descriptions FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage feature descriptions"
  ON public.plan_feature_descriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.plan_feature_descriptions (feature_key, display_name, short_description, long_description) VALUES
  ('diary', 'Smart Diary', 'Manage your schedule with an intelligent calendar', 'A powerful scheduling system that lets you manage lessons, block out time, and sync with external calendars. Pupils can see your availability and book directly.'),
  ('basic_pupil_management', 'Basic Pupil Management', 'Track up to 5 pupils', 'Manage pupil profiles, track their progress, and keep notes on each student.'),
  ('pupil_management', 'Full Pupil Management', 'Unlimited pupil tracking and progress', 'Complete pupil lifecycle management including progress tracking, lesson history, competency marking, and automated communications.'),
  ('mini_website', 'Mini Website', 'Your own professional instructor website', 'A fully branded mini-website with your own domain support, services page, reviews, contact form, and online booking.'),
  ('sms_notifications', 'SMS Notifications', 'Automated lesson reminders via text', 'Send automated lesson reminders, booking confirmations, and custom messages to pupils and parents via SMS.'),
  ('payment_tracking', 'Payment Tracking', 'Track payments and invoices', 'Full payment management with invoicing, payment history, QR code payments, and integration with payment providers.'),
  ('telematics', 'Telematics', 'GPS tracking and driving analysis', 'Real-time GPS tracking during lessons with speed monitoring, route recording, harsh braking detection, and detailed driving reports.'),
  ('expense_tracking', 'Expense Tracking', 'Log and categorise business expenses', 'Track fuel, maintenance, insurance, and other business expenses with receipt uploads and tax-ready reports.'),
  ('priority_support', 'Priority Support', 'Fast-track customer support', 'Get priority access to our support team with faster response times and dedicated assistance.'),
  ('custom_branding', 'Custom Branding', 'Personalise your portal and website', 'Apply your own logo, colours, and branding across your pupil portal and mini-website.'),
  ('multi_instructor', 'Multi-Instructor', 'Manage multiple instructors', 'Add and manage multiple instructors under one account with shared or separate diaries.'),
  ('fleet_management', 'Fleet Management', 'Track and manage your vehicle fleet', 'Monitor vehicle mileage, service schedules, MOT dates, and assign vehicles to instructors.'),
  ('shared_diary', 'Shared Diary', 'Team-wide calendar visibility', 'View and manage schedules across all instructors in your school from a single dashboard.'),
  ('team_analytics', 'Team Analytics', 'Cross-instructor reporting', 'Compare performance metrics, pass rates, and revenue across your team of instructors.'),
  ('all_max_features', 'All Max Features', 'Everything in the Max plan', 'Includes every feature from the Max plan tier.'),
  ('all_multi_features', 'All Multi Features', 'Everything in the Multi plan', 'Includes every feature from the Multi plan tier.'),
  ('dedicated_support', 'Dedicated Support', 'Named account manager', 'A dedicated account manager for your school with direct contact and tailored onboarding.'),
  ('api_access', 'API Access', 'Integrate with your own systems', 'RESTful API access to integrate EveryDriver data with your existing business systems.'),
  ('white_label', 'White Label', 'Fully rebrand the platform', 'Remove all EveryDriver branding and present the platform entirely under your own brand.'),
  ('custom_integrations', 'Custom Integrations', 'Bespoke system connections', 'We build custom integrations tailored to your school requirements.'),
  ('sla_guarantee', 'SLA Guarantee', 'Guaranteed uptime and response times', 'Service level agreement with guaranteed uptime, response times, and priority incident resolution.')
ON CONFLICT (feature_key) DO NOTHING;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plan_feature_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
