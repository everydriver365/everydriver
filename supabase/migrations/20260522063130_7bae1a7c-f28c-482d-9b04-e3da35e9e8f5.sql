CREATE OR REPLACE FUNCTION public.purge_instructor_data(
  p_instructor_id uuid,
  p_sentinel_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anonymise_tables text[] := ARRAY[
    'payment_history',
    'invoices',
    'invoice_items',
    'payouts',
    'instructor_payouts',
    'transaction_ledger',
    'mtd_submissions',
    'mtd_quarterly_summaries',
    'mtd_expenses',
    'mtd_income_records',
    'tax_year_summaries',
    'service_fee_records'
  ];
  v_preserve_tables text[] := ARRAY[
    'account_deletion_requests',
    'data_audit_log',
    'admin_alerts'
  ];
  v_skip_tables text[] := ARRAY[
    'user_roles',
    'instructor_mfa_recovery_codes',
    'school_instructors',
    'school_memberships'
  ];
  v_pupil_auth_ids uuid[] := ARRAY[]::uuid[];
  v_anonymised jsonb := '{}'::jsonb;
  v_deleted jsonb := '{}'::jsonb;
  v_preserved jsonb := '{}'::jsonb;
  v_skipped jsonb := '{}'::jsonb;
  r record;
  v_count bigint;
  v_sql text;
  v_has_instructor_id boolean;
  v_has_pupil_id boolean;
BEGIN
  -- Collect pupil auth ids for notification (before any deletes)
  BEGIN
    EXECUTE format(
      'SELECT COALESCE(array_agg(DISTINCT auth_user_id) FILTER (WHERE auth_user_id IS NOT NULL), ARRAY[]::uuid[]) FROM public.pupils WHERE instructor_id = %L',
      p_instructor_id
    ) INTO v_pupil_auth_ids;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    v_pupil_auth_ids := ARRAY[]::uuid[];
  END;

  -- 1) ANONYMISE pass: swap instructor_id -> sentinel, null pupil_id, null obvious PII
  FOREACH v_sql IN ARRAY v_anonymise_tables LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_sql
    ) INTO v_has_instructor_id;
    IF NOT v_has_instructor_id THEN CONTINUE; END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=v_sql AND column_name='instructor_id'
    ) INTO v_has_instructor_id;

    IF v_has_instructor_id THEN
      -- swap instructor_id
      EXECUTE format(
        'UPDATE public.%I SET instructor_id = %L WHERE instructor_id = %L',
        v_sql, p_sentinel_uuid, p_instructor_id
      );
      GET DIAGNOSTICS v_count = ROW_COUNT;
      v_anonymised := v_anonymised || jsonb_build_object(v_sql, v_count);

      -- null pupil_id if column exists
      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name=v_sql AND column_name='pupil_id') THEN
        EXECUTE format('UPDATE public.%I SET pupil_id = NULL WHERE instructor_id = %L', v_sql, p_sentinel_uuid);
      END IF;

      -- null common PII columns if present
      FOR r IN
        SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name=v_sql
          AND column_name = ANY (ARRAY['pupil_name','customer_name','customer_email','customer_phone','billing_email','billing_name','billing_address','notes','description','reference_name'])
      LOOP
        EXECUTE format('UPDATE public.%I SET %I = NULL WHERE instructor_id = %L', v_sql, r.column_name, p_sentinel_uuid);
      END LOOP;
    END IF;
  END LOOP;

  -- 2) PRESERVE pass: record table names only, do nothing
  FOREACH v_sql IN ARRAY v_preserve_tables LOOP
    v_preserved := v_preserved || jsonb_build_object(v_sql, 'preserved');
  END LOOP;

  -- 3) HARD DELETE pass: every other public table with instructor_id or pupil_id, except skip/anonymise/preserve
  FOR r IN
    SELECT c.table_name,
           bool_or(c.column_name = 'instructor_id') AS has_instr,
           bool_or(c.column_name = 'pupil_id')      AS has_pupil
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.column_name IN ('instructor_id','pupil_id')
    GROUP BY c.table_name
  LOOP
    IF r.table_name = ANY (v_skip_tables) THEN
      v_skipped := v_skipped || jsonb_build_object(r.table_name, 'skipped');
      CONTINUE;
    END IF;
    IF r.table_name = ANY (v_anonymise_tables) THEN CONTINUE; END IF;
    IF r.table_name = ANY (v_preserve_tables) THEN CONTINUE; END IF;

    v_count := 0;
    IF r.has_pupil THEN
      -- delete rows tied to this instructor's pupils
      BEGIN
        EXECUTE format(
          'DELETE FROM public.%I WHERE pupil_id IN (SELECT id FROM public.pupils WHERE instructor_id = %L)',
          r.table_name, p_instructor_id
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || jsonb_build_object(r.table_name || ':pupil_error', SQLERRM);
      END;
    END IF;

    IF r.has_instr THEN
      BEGIN
        EXECUTE format(
          'DELETE FROM public.%I WHERE instructor_id = %L',
          r.table_name, p_instructor_id
        );
        GET DIAGNOSTICS v_count = ROW_COUNT;
      EXCEPTION WHEN OTHERS THEN
        v_deleted := v_deleted || jsonb_build_object(r.table_name || ':instr_error', SQLERRM);
      END;
    END IF;

    v_deleted := v_deleted || jsonb_build_object(r.table_name, v_count);
  END LOOP;

  -- 4) Finally delete the pupils + instructor rows themselves
  BEGIN
    EXECUTE format('DELETE FROM public.pupils WHERE instructor_id = %L', p_instructor_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('pupils', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_deleted := v_deleted || jsonb_build_object('pupils:error', SQLERRM);
  END;

  BEGIN
    EXECUTE format('DELETE FROM public.instructors WHERE id = %L', p_instructor_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('instructors', v_count);
  EXCEPTION WHEN OTHERS THEN
    v_deleted := v_deleted || jsonb_build_object('instructors:error', SQLERRM);
  END;

  RETURN jsonb_build_object(
    'instructor_id', p_instructor_id,
    'sentinel_uuid', p_sentinel_uuid,
    'anonymised', v_anonymised,
    'deleted', v_deleted,
    'preserved', v_preserved,
    'skipped', v_skipped,
    'notified_pupil_auth_ids', to_jsonb(v_pupil_auth_ids)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_instructor_data(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_instructor_data(uuid, uuid) TO service_role;