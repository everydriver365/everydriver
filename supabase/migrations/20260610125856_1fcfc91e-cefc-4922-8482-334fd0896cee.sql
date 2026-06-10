
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS invoice_business_address text,
  ADD COLUMN IF NOT EXISTS invoice_vat_number text;

-- Storage policies on invoice-pdfs (bucket itself created via storage tool)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Instructors read own invoice pdfs') THEN
    CREATE POLICY "Instructors read own invoice pdfs"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'invoice-pdfs'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.instructors WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Service role manages invoice pdfs') THEN
    CREATE POLICY "Service role manages invoice pdfs"
      ON storage.objects FOR ALL TO service_role
      USING (bucket_id = 'invoice-pdfs')
      WITH CHECK (bucket_id = 'invoice-pdfs');
  END IF;
END$$;
