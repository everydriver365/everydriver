-- Add payment QR code URL column to instructors table
ALTER TABLE public.instructors 
ADD COLUMN payment_qr_url TEXT;