
CREATE OR REPLACE FUNCTION public.classify_sync_error(err text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN err IS NULL OR length(trim(err)) = 0 THEN 'unknown'
    WHEN err ~* '(GOOGLE_PRIVATE_KEY|malformed|Failed to decode base64|invalid_grant|unauthorized_client|PEM|service.account|JWT.*(sign|invalid)|DECODER routines|ERR_OSSL)'
      THEN 'credential'
    ELSE 'transient'
  END
$$;

CREATE OR REPLACE VIEW public.v_google_sync_credential_health
WITH (security_invoker = true)
AS
WITH recent AS (
  SELECT
    id,
    instructor_id,
    error,
    created_at,
    processed_at,
    public.classify_sync_error(error) AS error_class
  FROM public.calendar_sync_queue
  WHERE created_at > now() - interval '24 hours'
),
last_hour AS (
  SELECT
    COUNT(*) FILTER (WHERE error IS NOT NULL AND error_class = 'credential'
                       AND created_at > now() - interval '1 hour') AS cred_errors_1h,
    COUNT(*) FILTER (WHERE processed_at IS NOT NULL AND error IS NULL
                       AND created_at > now() - interval '1 hour') AS successes_1h
  FROM recent
),
latest_cred AS (
  SELECT error AS latest_credential_error,
         created_at AS latest_credential_error_at
  FROM recent
  WHERE error_class = 'credential'
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  (SELECT COUNT(*) FROM recent WHERE error IS NOT NULL) AS failed_count_last_24h,
  (SELECT COUNT(*) FROM recent WHERE error_class = 'credential') AS credential_error_count_last_24h,
  (SELECT cred_errors_1h FROM last_hour) AS credential_error_count_last_1h,
  (SELECT successes_1h FROM last_hour) AS successes_last_1h,
  (SELECT latest_credential_error FROM latest_cred) AS latest_credential_error,
  (SELECT latest_credential_error_at FROM latest_cred) AS latest_credential_error_at,
  CASE
    WHEN (SELECT cred_errors_1h FROM last_hour) >= 3
     AND (SELECT successes_1h FROM last_hour) = 0
    THEN true
    ELSE false
  END AS is_credential_broken;

GRANT SELECT ON public.v_google_sync_credential_health TO authenticated;
