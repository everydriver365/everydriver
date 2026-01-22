-- Create pupil push subscriptions table for web push notifications
CREATE TABLE public.pupil_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pupil_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.pupil_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow pupils to manage their own subscriptions (via service role for edge functions)
CREATE POLICY "Service role can manage pupil push subscriptions"
ON public.pupil_push_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_pupil_push_subscriptions_pupil_id ON public.pupil_push_subscriptions(pupil_id);

-- Add trigger for updated_at
CREATE TRIGGER update_pupil_push_subscriptions_updated_at
  BEFORE UPDATE ON public.pupil_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();