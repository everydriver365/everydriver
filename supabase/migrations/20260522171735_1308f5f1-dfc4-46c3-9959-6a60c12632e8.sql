-- Accounting affiliate links (admin-managed) + click tracking
CREATE TABLE public.accounting_affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE CHECK (platform IN ('xero','quickbooks','freeagent','sage')),
  affiliate_url text,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accounting_affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage affiliate links"
  ON public.accounting_affiliate_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_accounting_affiliate_links_updated_at
  BEFORE UPDATE ON public.accounting_affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed all 4 platforms inactive
INSERT INTO public.accounting_affiliate_links (platform) VALUES
  ('xero'), ('quickbooks'), ('freeagent'), ('sage')
ON CONFLICT (platform) DO NOTHING;

-- Public RPC for instructors to fetch active affiliate links (no row-level read access required)
CREATE OR REPLACE FUNCTION public.get_active_affiliate_links()
RETURNS TABLE(platform text, affiliate_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT platform, affiliate_url
  FROM public.accounting_affiliate_links
  WHERE is_active = true AND affiliate_url IS NOT NULL AND affiliate_url <> '';
$$;

GRANT EXECUTE ON FUNCTION public.get_active_affiliate_links() TO authenticated, anon;

-- Click tracking
CREATE TABLE public.affiliate_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform IN ('xero','quickbooks','freeagent','sage')),
  affiliate_url text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_link_clicks_instructor ON public.affiliate_link_clicks (instructor_id);
CREATE INDEX idx_affiliate_link_clicks_platform_time ON public.affiliate_link_clicks (platform, clicked_at DESC);

ALTER TABLE public.affiliate_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors insert own clicks"
  ON public.affiliate_link_clicks
  FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins read all clicks"
  ON public.affiliate_link_clicks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));