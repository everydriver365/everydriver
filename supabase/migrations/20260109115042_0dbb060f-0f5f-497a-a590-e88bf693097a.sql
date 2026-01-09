-- Create push_subscriptions table for storing push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Push subscriptions are publicly viewable" 
ON public.push_subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert push subscriptions" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update push subscriptions" 
ON public.push_subscriptions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete push subscriptions" 
ON public.push_subscriptions 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_push_subscriptions_instructor ON public.push_subscriptions(instructor_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();