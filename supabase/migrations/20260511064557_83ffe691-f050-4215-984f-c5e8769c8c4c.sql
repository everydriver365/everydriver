
CREATE TABLE public.custom_domain_admin_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  domain text NOT NULL,
  dns_verified_at timestamptz NOT NULL DEFAULT now(),
  ssl_added_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, domain)
);

ALTER TABLE public.custom_domain_admin_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view domain queue"
  ON public.custom_domain_admin_queue FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update domain queue"
  ON public.custom_domain_admin_queue FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete domain queue"
  ON public.custom_domain_admin_queue FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts domain queue"
  ON public.custom_domain_admin_queue FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_custom_domain_admin_queue_updated_at
  BEFORE UPDATE ON public.custom_domain_admin_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enqueue_verified_custom_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.custom_domain_verified = true
     AND (OLD.custom_domain_verified IS DISTINCT FROM true)
     AND NEW.custom_domain IS NOT NULL THEN
    INSERT INTO public.custom_domain_admin_queue (instructor_id, domain, dns_verified_at, status)
    VALUES (NEW.id, NEW.custom_domain, now(), 'pending')
    ON CONFLICT (instructor_id, domain) DO UPDATE
      SET dns_verified_at = now(), status = 'pending', updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER instructors_enqueue_verified_domain
  AFTER UPDATE OF custom_domain_verified ON public.instructors
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_verified_custom_domain();
