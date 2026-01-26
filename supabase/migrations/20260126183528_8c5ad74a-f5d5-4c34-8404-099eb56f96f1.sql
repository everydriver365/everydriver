-- Add comprehensive hero section fields to demo_mini_website (matching homepage_hero structure)
ALTER TABLE public.demo_mini_website 
ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'DVSA Approved',
ADD COLUMN IF NOT EXISTS headline_line1 TEXT DEFAULT 'Your Driving',
ADD COLUMN IF NOT EXISTS headline_line2 TEXT DEFAULT 'Success',
ADD COLUMN IF NOT EXISTS headline_highlight TEXT DEFAULT 'Story',
ADD COLUMN IF NOT EXISTS headline_line3 TEXT DEFAULT 'Starts Here',
ADD COLUMN IF NOT EXISTS search_placeholder TEXT DEFAULT 'Enter your postcode...',
ADD COLUMN IF NOT EXISTS search_button_text TEXT DEFAULT 'Find Lessons',
ADD COLUMN IF NOT EXISTS rating_value TEXT DEFAULT '4.9',
ADD COLUMN IF NOT EXISTS show_finance_badges BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS instructor_grade TEXT DEFAULT 'A',
ADD COLUMN IF NOT EXISTS instructor_name TEXT DEFAULT 'Demo Driving School',
ADD COLUMN IF NOT EXISTS instructor_phone TEXT DEFAULT '07700 900123',
ADD COLUMN IF NOT EXISTS instructor_postcode TEXT DEFAULT 'SW1A 1AA',
ADD COLUMN IF NOT EXISTS cpd_certified BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cta_heading TEXT DEFAULT 'Ready to Start Your Driving Journey?',
ADD COLUMN IF NOT EXISTS cta_subtext TEXT DEFAULT 'Book your first lesson today and join thousands of successful drivers.',
ADD COLUMN IF NOT EXISTS cta_button_text TEXT DEFAULT 'Book a Lesson',
ADD COLUMN IF NOT EXISTS cta_phone_text TEXT DEFAULT 'Call Now';

-- Update existing home page with default values from current hero_heading/hero_subheading if they exist
UPDATE public.demo_mini_website
SET 
  headline_line1 = COALESCE(SPLIT_PART(hero_heading, ' ', 1) || ' ' || SPLIT_PART(hero_heading, ' ', 2), 'Your Driving'),
  headline_line2 = COALESCE(SPLIT_PART(hero_heading, ' ', 3), 'Success'),
  headline_highlight = COALESCE(SPLIT_PART(hero_heading, ' ', 4), 'Story'),
  headline_line3 = COALESCE(NULLIF(TRIM(SUBSTRING(hero_heading FROM POSITION(SPLIT_PART(hero_heading, ' ', 5) IN hero_heading))), ''), 'Starts Here')
WHERE page_type = 'home' AND hero_heading IS NOT NULL AND hero_heading != '';