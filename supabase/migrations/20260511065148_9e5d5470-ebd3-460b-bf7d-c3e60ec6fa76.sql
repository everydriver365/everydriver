
CREATE TABLE public.custom_domain_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  domain text NOT NULL,
  event text NOT NULL,
  actor_user_id uuid,
  actor_role text NOT NULL DEFAULT 'system',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cdal_instructor ON public.custom_domain_audit_log(instructor_id, created_at DESC);
CREATE INDEX idx_cdal_domain ON public.custom_domain_audit_log(domain, created_at DESC);
CREATE INDEX idx_cdal_event ON public.custom_domain_audit_log(event, created_at DESC);

ALTER TABLE public.custom_domain_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view domain audit log"
  ON public.custom_domain_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors view their own domain audit log"
  ON public.custom_domain_audit_log FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- No INSERT/UPDATE/DELETE policy: only SECURITY DEFINER triggers may write.

CREATE OR REPLACE FUNCTION public.log_custom_domain_event(
  p_instructor_id uuid,
  p_domain text,
  p_event text,
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := 'system';
  v_uid  uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL THEN
    IF public.has_role(v_uid, 'admin') THEN
      v_role := 'admin';
    ELSIF EXISTS (SELECT 1 FROM public.instructors WHERE auth_user_id = v_uid) THEN
      v_role := 'instructor';
    ELSE
      v_role := 'user';
    END IF;
  END IF;

  INSERT INTO public.custom_domain_audit_log
    (instructor_id, domain, event, actor_user_id, actor_role, notes, metadata)
  VALUES (p_instructor_id, p_domain, p_event, v_uid, v_role, p_notes, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

-- Trigger: on instructors table — added / removed / verified / unverified
CREATE OR REPLACE FUNCTION public.audit_instructor_custom_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Domain string changed
  IF COALESCE(OLD.custom_domain,'') IS DISTINCT FROM COALESCE(NEW.custom_domain,'') THEN
    IF NEW.custom_domain IS NOT NULL AND NEW.custom_domain <> '' THEN
      PERFORM public.log_custom_domain_event(NEW.id, NEW.custom_domain, 'added',
        NULL,
        jsonb_build_object('previous', OLD.custom_domain));
    END IF;
    IF (OLD.custom_domain IS NOT NULL AND OLD.custom_domain <> '')
       AND (NEW.custom_domain IS NULL OR NEW.custom_domain = '') THEN
      PERFORM public.log_custom_domain_event(NEW.id, OLD.custom_domain, 'removed', NULL, '{}'::jsonb);
    END IF;
  END IF;

  -- Verification flipped
  IF COALESCE(OLD.custom_domain_verified, false) IS DISTINCT FROM COALESCE(NEW.custom_domain_verified, false)
     AND NEW.custom_domain IS NOT NULL THEN
    IF NEW.custom_domain_verified = true THEN
      PERFORM public.log_custom_domain_event(NEW.id, NEW.custom_domain, 'verified', NULL, '{}'::jsonb);
    ELSE
      PERFORM public.log_custom_domain_event(NEW.id, NEW.custom_domain, 'unverified', NULL, '{}'::jsonb);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER instructors_audit_custom_domain
  AFTER UPDATE OF custom_domain, custom_domain_verified ON public.instructors
  FOR EACH ROW EXECUTE FUNCTION public.audit_instructor_custom_domain();

-- Trigger: on admin queue — ssl_added / skipped / reopened
CREATE OR REPLACE FUNCTION public.audit_custom_domain_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_custom_domain_event(NEW.instructor_id, NEW.domain, 'queued',
      NEW.admin_notes,
      jsonb_build_object('status', NEW.status));
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_event := CASE NEW.status
      WHEN 'added'   THEN 'ssl_added'
      WHEN 'skipped' THEN 'skipped'
      WHEN 'pending' THEN 'reopened'
      ELSE 'status_changed'
    END;
    PERFORM public.log_custom_domain_event(NEW.instructor_id, NEW.domain, v_event,
      NEW.admin_notes,
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER custom_domain_queue_audit
  AFTER INSERT OR UPDATE ON public.custom_domain_admin_queue
  FOR EACH ROW EXECUTE FUNCTION public.audit_custom_domain_queue();
