
ALTER TABLE public.quotes
  ALTER COLUMN quote_ref SET DEFAULT (
    'Q-' || extract(year FROM now())::int
         || '-' || lpad(nextval('public.quote_ref_seq')::text, 4, '0')
  );
