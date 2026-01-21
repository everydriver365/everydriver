-- Create booking_upsells table (product catalog)
CREATE TABLE public.booking_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  price NUMERIC(10,2) NOT NULL,
  refund_policy TEXT,
  icon_name TEXT DEFAULT 'Zap',
  badge_text TEXT,
  highlight_color TEXT DEFAULT '#10b981',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pupil_upsells table (purchased upsells per pupil)
CREATE TABLE public.pupil_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  upsell_id UUID NOT NULL REFERENCES public.booking_upsells(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'fulfilled', 'refunded', 'cancelled')),
  amount_paid NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  refund_requested_at TIMESTAMP WITH TIME ZONE,
  refund_processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.booking_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupil_upsells ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_upsells
-- Public read access for active upsells (for booking flow)
CREATE POLICY "Anyone can view active upsells" 
ON public.booking_upsells 
FOR SELECT 
USING (is_active = true);

-- Service role has full access (for admin management)
CREATE POLICY "Service role has full access to booking_upsells" 
ON public.booking_upsells 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for pupil_upsells
-- Instructors can view upsells for their pupils
CREATE POLICY "Instructors can view their pupils upsells" 
ON public.pupil_upsells 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pupils 
    WHERE pupils.id = pupil_upsells.pupil_id 
    AND pupils.instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  )
);

-- Service role has full access
CREATE POLICY "Service role has full access to pupil_upsells" 
ON public.pupil_upsells 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_booking_upsells_active ON public.booking_upsells(is_active, display_order);
CREATE INDEX idx_pupil_upsells_pupil ON public.pupil_upsells(pupil_id);
CREATE INDEX idx_pupil_upsells_status ON public.pupil_upsells(status);

-- Add updated_at trigger for booking_upsells
CREATE TRIGGER update_booking_upsells_updated_at
BEFORE UPDATE ON public.booking_upsells
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for pupil_upsells
CREATE TRIGGER update_pupil_upsells_updated_at
BEFORE UPDATE ON public.pupil_upsells
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the "Guaranteed Earlier Test" upsell
INSERT INTO public.booking_upsells (
  name, 
  short_description, 
  full_description, 
  price, 
  refund_policy, 
  icon_name, 
  badge_text, 
  highlight_color,
  is_featured,
  display_order
)
VALUES (
  'Guaranteed Earlier Test',
  'We''ll find you an earlier test date or your money back!',
  'Our dedicated team will actively monitor DVSA cancellations 24/7 and work to secure you an earlier practical driving test date. We use advanced booking systems to check for cancellations across multiple test centres near you. If we successfully find an earlier date, we''ll notify you immediately so you can confirm. If we cannot find an earlier test date before your original booking, you''ll receive a full refund of this fee - no questions asked.',
  49.99,
  'Full refund guaranteed if we cannot find an earlier test date before your original booking. Refunds processed within 5 working days.',
  'CalendarSearch',
  'POPULAR',
  '#10b981',
  true,
  1
);