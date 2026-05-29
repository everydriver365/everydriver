
-- ============================================================
-- Hide soft-deleted records globally via RLS
-- ============================================================

-- ---------- PUPILS ----------
DROP POLICY IF EXISTS "Instructors manage own pupils" ON public.pupils;
DROP POLICY IF EXISTS "Instructors can view their own pupils" ON public.pupils;
DROP POLICY IF EXISTS "Pupils can view their own row" ON public.pupils;

-- Split former ALL policy into INSERT/UPDATE/DELETE (no SELECT here so the
-- SELECT policy below is the single source of truth for read visibility).
CREATE POLICY "Instructors insert own pupils"
  ON public.pupils FOR INSERT TO authenticated
  WITH CHECK (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Instructors update own pupils"
  ON public.pupils FOR UPDATE TO authenticated
  USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Instructors delete own pupils"
  ON public.pupils FOR DELETE TO authenticated
  USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Instructors view own non-deleted pupils"
  ON public.pupils FOR SELECT TO authenticated
  USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Pupils view their own non-deleted row"
  ON public.pupils FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- Admins keep full visibility (incl. trash/restore UIs)
CREATE POLICY "Admins view all pupils incl deleted"
  ON public.pupils FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- ---------- SCHEDULED_LESSONS ----------
DROP POLICY IF EXISTS "Instructors view own scheduled lessons" ON public.scheduled_lessons;

CREATE POLICY "Instructors view own non-deleted scheduled lessons"
  ON public.scheduled_lessons FOR SELECT TO authenticated
  USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Admins view all scheduled lessons incl deleted"
  ON public.scheduled_lessons FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- ---------- LESSON_PACKAGES ----------
DROP POLICY IF EXISTS "Instructors can manage their own packages" ON public.lesson_packages;
DROP POLICY IF EXISTS "Pupils can view active packages" ON public.lesson_packages;

CREATE POLICY "Instructors insert own packages"
  ON public.lesson_packages FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own packages"
  ON public.lesson_packages FOR UPDATE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors delete own packages"
  ON public.lesson_packages FOR DELETE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors view own non-deleted packages"
  ON public.lesson_packages FOR SELECT TO authenticated
  USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Anyone can view active non-deleted packages"
  ON public.lesson_packages FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Admins view all packages incl deleted"
  ON public.lesson_packages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- ---------- MESSAGES ----------
DROP POLICY IF EXISTS "Instructors manage own messages" ON public.messages;
DROP POLICY IF EXISTS "pupils_read_own_messages" ON public.messages;

CREATE POLICY "Instructors insert own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Instructors update own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Instructors delete own messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Instructors read own non-deleted messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

CREATE POLICY "pupils_read_own_non_deleted_messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND conversation_id IN (
      SELECT c.id FROM public.conversations c
      WHERE c.pupil_id IN (
        SELECT p.id FROM public.pupils p
        WHERE p.auth_user_id = auth.uid()
      )
    )
  );


-- ---------- NOTES ----------
DROP POLICY IF EXISTS "Instructors can manage own notes" ON public.notes;
DROP POLICY IF EXISTS "Instructors can read pupil notes for their pupils" ON public.notes;

CREATE POLICY "Instructors insert own notes"
  ON public.notes FOR INSERT TO authenticated
  WITH CHECK (
    owner_type = 'instructor'
    AND owner_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE POLICY "Instructors update own notes"
  ON public.notes FOR UPDATE TO authenticated
  USING (
    owner_type = 'instructor'
    AND owner_id = public.get_instructor_id_for_user(auth.uid())
  )
  WITH CHECK (
    owner_type = 'instructor'
    AND owner_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE POLICY "Instructors delete own notes"
  ON public.notes FOR DELETE TO authenticated
  USING (
    owner_type = 'instructor'
    AND owner_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE POLICY "Instructors read own non-deleted notes"
  ON public.notes FOR SELECT TO authenticated
  USING (
    owner_type = 'instructor'
    AND owner_id = public.get_instructor_id_for_user(auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Instructors read non-deleted pupil notes for their pupils"
  ON public.notes FOR SELECT TO authenticated
  USING (
    owner_type = 'pupil'
    AND deleted_at IS NULL
    AND owner_id IN (
      SELECT p.id FROM public.pupils p
      WHERE p.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );
