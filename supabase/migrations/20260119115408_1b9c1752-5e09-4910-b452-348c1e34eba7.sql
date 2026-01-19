-- Create table for remote signing tokens
CREATE TABLE public.remote_signing_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  terms_id UUID NOT NULL REFERENCES public.instructor_terms_conditions(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'opened', 'signed', 'expired'))
);

-- Enable RLS
ALTER TABLE public.remote_signing_tokens ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own tokens
CREATE POLICY "Instructors can view their own tokens"
  ON public.remote_signing_tokens FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create tokens"
  ON public.remote_signing_tokens FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their tokens"
  ON public.remote_signing_tokens FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Allow anonymous access for token validation (needed for public signing page)
CREATE POLICY "Anyone can read valid tokens for signing"
  ON public.remote_signing_tokens FOR SELECT
  USING (status IN ('pending', 'opened') AND expires_at > now());

-- Allow anonymous updates for marking tokens as used
CREATE POLICY "Anyone can update token status when signing"
  ON public.remote_signing_tokens FOR UPDATE
  USING (status IN ('pending', 'opened') AND expires_at > now());

-- Index for token lookup
CREATE INDEX idx_remote_signing_tokens_token ON public.remote_signing_tokens(token);
CREATE INDEX idx_remote_signing_tokens_expires ON public.remote_signing_tokens(expires_at);
CREATE INDEX idx_remote_signing_tokens_status ON public.remote_signing_tokens(status);