-- Add test booking columns to pupils table
ALTER TABLE public.pupils 
ADD COLUMN test_date date,
ADD COLUMN test_time time without time zone,
ADD COLUMN test_centre_id uuid REFERENCES public.test_centres(id);