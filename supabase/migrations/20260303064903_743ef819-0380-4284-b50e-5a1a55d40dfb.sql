
-- Fix overly permissive policies on pupil_terms_agreements
DROP POLICY IF EXISTS "Public can update by token" ON public.pupil_terms_agreements;
CREATE POLICY "Update agreement by token"
ON public.pupil_terms_agreements FOR UPDATE
USING (status = 'pending' AND token IS NOT NULL);

-- Fix overly permissive policies on theory_mock_scores
DROP POLICY IF EXISTS "Pupils can insert own mock scores" ON public.theory_mock_scores;
DROP POLICY IF EXISTS "Pupils can view own mock scores" ON public.theory_mock_scores;

-- Pupils access via pupil portal (no auth), so we need to allow by pupil_id lookup
-- But the pupil portal uses parent_phone auth, not supabase auth
-- Keep SELECT open for pupil portal, restrict INSERT 
CREATE POLICY "Pupils can insert mock scores via portal"
ON public.theory_mock_scores FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pupils WHERE id = pupil_id)
);
