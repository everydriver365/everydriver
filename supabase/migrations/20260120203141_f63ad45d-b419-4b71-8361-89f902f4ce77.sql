-- Create public FAQs table for the main site
CREATE TABLE public.public_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_faqs ENABLE ROW LEVEL SECURITY;

-- Public can read published FAQs
CREATE POLICY "Anyone can view published FAQs"
ON public.public_faqs
FOR SELECT
USING (is_published = true);

-- Admins can manage FAQs (using the has_role function)
CREATE POLICY "Admins can manage FAQs"
ON public.public_faqs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default FAQs
INSERT INTO public.public_faqs (question, answer, category, display_order, is_published) VALUES
('How many lessons do I need before my test?', 'The average learner needs around 45 hours of professional tuition combined with 22 hours of private practice. However, this varies greatly depending on individual learning speed and prior experience.', 'Getting Started', 1, true),
('What should I bring to my first lesson?', 'You must bring your valid provisional driving licence. Wear comfortable shoes (no high heels or flip-flops) and bring glasses if you need them for driving. We recommend comfortable clothing too.', 'Getting Started', 2, true),
('Can I cancel or reschedule a lesson?', 'Yes, you can cancel or reschedule lessons with at least 48 hours notice at no charge. Cancellations with less notice may incur a fee.', 'Booking & Scheduling', 3, true),
('Do you offer automatic and manual lessons?', 'Yes, we have instructors teaching both automatic and manual vehicles. You can choose based on your preference. Note that a manual licence allows you to drive both, while an automatic licence only covers automatics.', 'Lessons', 4, true),
('How do I book my practical driving test?', 'Your instructor can help you book your practical test when you''re ready. Alternatively, you can book directly through the DVSA website. Your instructor will advise when you''re test-ready.', 'Tests', 5, true),
('What payment methods do you accept?', 'We accept all major credit and debit cards. We also offer pay-in-3 with Klarna and pay-in-4 with Clearpay for flexible payment options.', 'Payments', 6, true),
('Are intensive courses suitable for complete beginners?', 'Yes! Our intensive courses are designed for all skill levels. Complete beginners may benefit from a slightly longer course (30-40 hours) while those with some experience may be test-ready sooner.', 'Courses', 7, true);