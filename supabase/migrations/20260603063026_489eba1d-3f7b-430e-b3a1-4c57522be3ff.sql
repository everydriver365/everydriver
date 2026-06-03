ALTER VIEW public.public_instructors SET (security_invoker = false);
GRANT SELECT ON public.public_instructors TO anon, authenticated;