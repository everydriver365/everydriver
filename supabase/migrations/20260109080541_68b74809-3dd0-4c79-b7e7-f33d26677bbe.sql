-- Add CPD, ADI Code of Practice, and Grade fields to instructors
ALTER TABLE public.instructors
ADD COLUMN cpd_certified boolean DEFAULT false,
ADD COLUMN adi_code_of_practice boolean DEFAULT false,
ADD COLUMN instructor_grade text;