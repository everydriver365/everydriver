-- Enable Realtime publication for remaining gaps and waitlist tables
-- Using IF NOT EXISTS pattern via DO block
DO $$
BEGIN
  -- Check and add instructor_working_hours
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'instructor_working_hours'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_working_hours;
  END IF;
  
  -- Check and add instructor_date_overrides
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'instructor_date_overrides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_date_overrides;
  END IF;
  
  -- Check and add instructor_manual_blocks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'instructor_manual_blocks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_manual_blocks;
  END IF;
  
  -- Check and add instructor_calendar_events
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'instructor_calendar_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_calendar_events;
  END IF;
  
  -- Check and add lesson_waitlist
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'lesson_waitlist'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_waitlist;
  END IF;
  
  -- Check and add slot_offers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'slot_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_offers;
  END IF;
END $$;