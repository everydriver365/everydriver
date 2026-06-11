
-- 1. Unique index on instructors.auth_user_id (partial to allow NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS instructors_auth_user_id_uidx
  ON public.instructors(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- 2. Minimal session bundle RPC. SECURITY DEFINER bypasses RLS so a single
--    indexed lookup serves the post-login redirect — no wide SELECTs, no
--    extra round-trip for the pending-deletion check.
CREATE OR REPLACE FUNCTION public.get_my_instructor_session()
RETURNS TABLE (
  instructor_id           uuid,
  name                    text,
  app_slug                text,
  is_active               boolean,
  plan_slug               text,
  plan_name               text,
  features                jsonb,
  deletion_pending_until  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    i.id                                AS instructor_id,
    i.name                              AS name,
    i.app_slug                          AS app_slug,
    i.is_active                         AS is_active,
    sp.slug                             AS plan_slug,
    sp.name                             AS plan_name,
    COALESCE(to_jsonb(sp.features), '[]'::jsonb) AS features,
    CASE
      WHEN i.deleted_at IS NOT NULL
       AND i.scheduled_purge_at IS NOT NULL
       AND i.scheduled_purge_at > now()
      THEN i.scheduled_purge_at
      ELSE NULL
    END                                 AS deletion_pending_until
  FROM public.instructors i
  LEFT JOIN public.instructor_subscriptions isub
         ON isub.instructor_id = i.id
        AND isub.status = 'active'
  LEFT JOIN public.subscription_plans sp
         ON sp.id = isub.plan_id
  WHERE i.auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_instructor_session() TO authenticated;
