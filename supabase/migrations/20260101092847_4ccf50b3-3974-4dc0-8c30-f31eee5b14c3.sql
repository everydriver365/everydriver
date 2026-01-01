-- Add new columns to instructors
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_calendar_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preferred_lesson_length INTEGER NOT NULL DEFAULT 60;

-- Create test centres table
CREATE TABLE public.test_centres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  postcode TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.test_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Test centres are publicly viewable" 
ON public.test_centres FOR SELECT USING (true);

CREATE POLICY "Anyone can manage test centres" 
ON public.test_centres FOR ALL USING (true);

-- Insert common UK driving test centres
INSERT INTO public.test_centres (name, postcode) VALUES
('Barnet', 'EN5 5SJ'),
('Borehamwood', 'WD6 1WA'),
('Cheetham Hill', 'M8 8EP'),
('Enfield', 'EN3 5PA'),
('Goodmayes', 'IG3 9TT'),
('Hendon', 'NW4 3ST'),
('Mill Hill', 'NW7 3HU'),
('Pinner', 'HA5 5HQ'),
('Tottenham', 'N17 8JB'),
('Wanstead', 'E11 2LR'),
('Wood Green', 'N22 5NL'),
('Sidcup', 'DA14 6PH'),
('Croydon', 'CR0 1NX'),
('Bromley', 'BR1 3HW'),
('Sutton', 'SM1 1DA'),
('Mitcham', 'CR4 3BG'),
('Worcester Park', 'KT4 8ES'),
('Morden', 'SM4 4DA'),
('Ashford (Middlesex)', 'TW15 1AU'),
('Uxbridge', 'UB8 1PN'),
('Yeading', 'UB4 9SP'),
('Isleworth', 'TW7 4EX'),
('South Mimms', 'EN6 3NH'),
('Watford', 'WD25 9EY'),
('St Albans', 'AL1 4JH'),
('Luton', 'LU1 5AW'),
('Stevenage', 'SG1 4PH'),
('Slough', 'SL1 4YB'),
('Reading', 'RG1 1LX'),
('Oxford', 'OX4 2AU'),
('Birmingham (South Yardley)', 'B26 2AA'),
('Manchester (Cheetham Hill)', 'M8 8EP'),
('Leeds (Harehills)', 'LS9 6LE'),
('Liverpool (Garston)', 'L19 5NF'),
('Sheffield (Handsworth)', 'S13 9NP'),
('Bristol (Brislington)', 'BS4 3EW'),
('Edinburgh (Currie)', 'EH14 5AE'),
('Glasgow (Shieldhall)', 'G51 4RY'),
('Cardiff', 'CF11 8EU'),
('Belfast', 'BT4 2HD');

-- Create instructor test centres junction table
CREATE TABLE public.instructor_test_centres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  test_centre_id UUID NOT NULL REFERENCES public.test_centres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, test_centre_id)
);

ALTER TABLE public.instructor_test_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor test centres are publicly viewable" 
ON public.instructor_test_centres FOR SELECT USING (true);

CREATE POLICY "Anyone can manage instructor test centres" 
ON public.instructor_test_centres FOR ALL USING (true);

-- Create instructor courses table
CREATE TABLE public.instructor_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  course_hours INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, course_hours)
);

ALTER TABLE public.instructor_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor courses are publicly viewable" 
ON public.instructor_courses FOR SELECT USING (true);

CREATE POLICY "Anyone can manage instructor courses" 
ON public.instructor_courses FOR ALL USING (true);

-- Create calendar events table to store synced events
CREATE TABLE public.instructor_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  title TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_busy BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, google_event_id)
);

ALTER TABLE public.instructor_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendar events are publicly viewable" 
ON public.instructor_calendar_events FOR SELECT USING (true);

CREATE POLICY "Anyone can manage calendar events" 
ON public.instructor_calendar_events FOR ALL USING (true);