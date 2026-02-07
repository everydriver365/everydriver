
-- Table to define which menu items require which feature
-- Admin can configure this to control what each plan tier sees
CREATE TABLE public.menu_feature_gates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_key TEXT NOT NULL UNIQUE,
  menu_item_label TEXT NOT NULL,
  menu_section TEXT NOT NULL,
  required_feature TEXT,
  is_locked_for_free BOOLEAN NOT NULL DEFAULT false,
  upgrade_message TEXT DEFAULT 'Upgrade your plan to access this feature',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_feature_gates ENABLE ROW LEVEL SECURITY;

-- Everyone can read (instructors need to check their gates)
CREATE POLICY "Anyone can read menu gates"
  ON public.menu_feature_gates FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage menu gates"
  ON public.menu_feature_gates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER set_menu_feature_gates_updated_at
  BEFORE UPDATE ON public.menu_feature_gates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed with the menu items from InstructorMenu
INSERT INTO public.menu_feature_gates (menu_item_key, menu_item_label, menu_section, required_feature, is_locked_for_free, display_order) VALUES
  ('todos', 'To Do', 'Quick Actions', NULL, false, 1),
  ('messages', 'Messages', 'Quick Actions', NULL, false, 2),
  ('jobs', 'Job Offers', 'Quick Actions', NULL, false, 3),
  ('pending-scheduling', 'New Bookings', 'Quick Actions', NULL, false, 4),
  ('pay', 'Take a Payment', 'Quick Actions', 'payment_tracking', true, 5),
  ('traccar', 'Live Tracking', 'Quick Actions', 'telematics', true, 6),
  ('find-my-car', 'Find My Car', 'Quick Actions', 'telematics', true, 7),
  ('expenses', 'Expenses', 'Quick Actions', 'expense_tracking', true, 8),
  ('payments', 'Payments', 'Money & Reports', 'payment_tracking', true, 10),
  ('income', 'Income Summary', 'Money & Reports', 'payment_tracking', true, 11),
  ('in-out', 'Income vs Expenses', 'Money & Reports', 'expense_tracking', true, 12),
  ('mileage', 'Mileage Tracker', 'Money & Reports', NULL, false, 13),
  ('tax', 'Tax Summary', 'Money & Reports', 'expense_tracking', true, 14),
  ('schedule', 'Schedule', 'Schedule & Pupils', 'diary', false, 20),
  ('pupils', 'Pupils', 'Schedule & Pupils', NULL, false, 21),
  ('vehicle-health', 'Vehicle Health', 'Tools', 'telematics', true, 30),
  ('test-result-quick', 'Log Test Result', 'Tools', NULL, false, 31),
  ('test-results', 'Full Test Report (DL25A)', 'Tools', NULL, false, 32),
  ('routes', 'Saved Routes', 'Tools', 'telematics', true, 33),
  ('doodlepad', 'Jotter', 'Tools', NULL, false, 34),
  ('gaps', 'Fill Gaps', 'Tools', 'sms_notifications', true, 35),
  ('health', 'Health Hub', 'Wellbeing', NULL, false, 40),
  ('settings', 'All Settings', 'Settings', NULL, false, 50),
  ('website', 'Mini-Website', 'Settings', 'mini_website', false, 51),
  ('faqs', 'FAQs & Help', 'Settings', NULL, false, 52);
