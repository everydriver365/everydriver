-- 1. instructor_whatsapp_accounts
CREATE TABLE public.instructor_whatsapp_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL UNIQUE REFERENCES public.instructors(id) ON DELETE CASCADE,
  waba_id TEXT,
  phone_number_id TEXT UNIQUE,
  display_phone TEXT,
  access_token TEXT,
  verified_name TEXT,
  quality_rating TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  connected_at TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  last_health_status JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view their own whatsapp account"
  ON public.instructor_whatsapp_accounts FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert their own whatsapp account"
  ON public.instructor_whatsapp_accounts FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update their own whatsapp account"
  ON public.instructor_whatsapp_accounts FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete their own whatsapp account"
  ON public.instructor_whatsapp_accounts FOR DELETE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER trg_iwa_updated_at
  BEFORE UPDATE ON public.instructor_whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. whatsapp_templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  meta_template_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'utility',
  language TEXT NOT NULL DEFAULT 'en_GB',
  body_text TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, name, language)
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view their own templates"
  ON public.whatsapp_templates FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert their own templates"
  ON public.whatsapp_templates FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update their own templates"
  ON public.whatsapp_templates FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete their own templates"
  ON public.whatsapp_templates FOR DELETE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER trg_wt_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Media columns on whatsapp_messages
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS media_mime TEXT;

-- 4. pupil_id on whatsapp_conversations
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wa_conv_pupil ON public.whatsapp_conversations(pupil_id);

-- 5. WhatsApp opt-in on pupils
ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;