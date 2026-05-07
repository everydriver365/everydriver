-- Switch the safe public view to security definer so it can read the locked-down
-- base table on behalf of anonymous visitors. The base `instructors` table
-- remains inaccessible to anon (PII columns stay private).
ALTER VIEW public.public_instructors SET (security_invoker = false);

-- Ensure the safe view is readable by public visitors and signed-in users.
GRANT SELECT ON public.public_instructors TO anon, authenticated;