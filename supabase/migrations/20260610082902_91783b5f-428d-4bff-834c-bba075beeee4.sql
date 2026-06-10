
-- Fix 1: Quotes — remove broad anon SELECT by token
DROP POLICY IF EXISTS "Public can read quote by token" ON public.quotes;

-- Fix 3: expense-receipts bucket private + path-scoped
DROP POLICY IF EXISTS "Authenticated can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete receipts" ON storage.objects;

CREATE POLICY "Instructors view own expense receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Instructors upload own expense receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Instructors update own expense receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Instructors delete own expense receipts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);

-- Fix 4: pass-reports bucket scoped + admin override
DROP POLICY IF EXISTS "pass-reports public read" ON storage.objects;

CREATE POLICY "Instructors view own pass reports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'pass-reports'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Admins view all pass reports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'pass-reports'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Fix 5: signatures bucket — path-scoped
DROP POLICY IF EXISTS "Instructors can view their signatures" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can upload signatures" ON storage.objects;

CREATE POLICY "Instructors view own signatures"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'signatures'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Instructors upload own signatures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'signatures'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);

-- Fix 6: voice-notes bucket — path-scoped
DROP POLICY IF EXISTS "Instructors can read own voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can delete own voice notes" ON storage.objects;

CREATE POLICY "Instructors read own voice notes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'voice-notes'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Instructors upload own voice notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);
CREATE POLICY "Instructors delete own voice notes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'voice-notes'
  AND split_part(name, '/', 1)::uuid = public.get_instructor_id_for_user(auth.uid())
);

-- Fix 7: pupil_native_push_bindings — remove open anon access
DROP POLICY IF EXISTS "Anyone can read a pupil native push binding" ON public.pupil_native_push_bindings;
DROP POLICY IF EXISTS "Anyone can update a pupil native push binding" ON public.pupil_native_push_bindings;
DROP POLICY IF EXISTS "Anyone can upsert a pupil native push binding" ON public.pupil_native_push_bindings;

CREATE POLICY "Pupils manage own push bindings"
ON public.pupil_native_push_bindings FOR ALL TO authenticated
USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()))
WITH CHECK (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role manages push bindings"
ON public.pupil_native_push_bindings FOR ALL TO service_role
USING (true) WITH CHECK (true);
