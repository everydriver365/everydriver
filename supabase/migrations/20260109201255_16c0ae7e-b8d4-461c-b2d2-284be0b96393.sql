-- Create included_features table for "What's Included With Every Course" section
CREATE TABLE public.included_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_content TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Star',
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.included_features ENABLE ROW LEVEL SECURITY;

-- Allow public read access (these are displayed on homepage)
CREATE POLICY "Anyone can view active included features"
  ON public.included_features
  FOR SELECT
  USING (is_active = true);

-- Allow all operations for now (admin functionality)
CREATE POLICY "Allow all operations for included features"
  ON public.included_features
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_included_features_updated_at
  BEFORE UPDATE ON public.included_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with the 6 default features
INSERT INTO public.included_features (title, description, detailed_content, icon_name, display_order) VALUES
('Theory Test Support', 'Access our comprehensive theory test preparation materials and practice tests.', E'Get ready for your theory test with our comprehensive preparation package.\n\nOur theory support includes:\n• Access to all official DVSA practice questions\n• Hazard perception test training\n• Mock tests to track your progress\n• Study guides and revision materials\n\nAll included free with your driving course booking.', 'BookOpen', 1),
('Flexible Payments', 'Pay your way with Klarna, Clearpay, or 0% finance options available.', E'We believe everyone should have access to quality driving lessons.\n\nPayment options include:\n• Klarna - Pay in 3 instalments\n• Clearpay - Split into 4 payments\n• 0% Finance - Spread the cost over 6-12 months\n• Card payments - Visa, Mastercard, Amex\n\nNo credit checks required for pay-later options. Subject to terms and conditions.', 'CreditCard', 2),
('Free Cancellation', 'Life happens. Cancel or reschedule lessons with 48 hours notice at no cost.', E'We understand plans change, so we make it easy to adjust your lessons.\n\nOur cancellation policy:\n• Free cancellation with 48+ hours notice\n• Easy online rescheduling\n• No hidden fees or penalties\n• Unused hours never expire\n\nSimply log into your pupil portal or contact your instructor to make changes.', 'Calendar', 3),
('FREE Re-Test', E'If you don''t pass first time, we''ll cover your re-test fee. That''s our promise.', E'We''re so confident in our teaching that we guarantee your success.\n\nOur FREE re-test promise:\n• If you fail your practical test, we cover the re-test fee\n• Additional practice hours provided if needed\n• No time limit on using this benefit\n• Applies to all intensive course bookings\n\nTerms and conditions apply. Ask your instructor for full details.', 'Award', 4),
('Live Availability', 'See real-time instructor availability and book instantly online 24/7.', E'Book lessons at your convenience with our real-time booking system.\n\nLive availability features:\n• See instructor calendars in real-time\n• Book lessons 24/7 online\n• Instant confirmation\n• Synced with Google Calendar\n\nNo more back-and-forth calls. Just pick a time that works for you.', 'Clock', 5),
('Theory Test Pro', E'Premium access to Theory Test Pro app - the #1 rated theory test app in the UK.', E'Get premium access to the UK''s most popular theory test app.\n\nTheory Test Pro includes:\n• All official DVSA revision questions\n• Unlimited mock tests\n• Hazard perception practice\n• Progress tracking and weak area analysis\n• Works on mobile, tablet and desktop\n\nUsually £4.99/month - included FREE with your course!', 'GraduationCap', 6);