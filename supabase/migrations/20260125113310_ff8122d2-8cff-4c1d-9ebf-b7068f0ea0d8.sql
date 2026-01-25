-- Add username and password columns for website credentials
ALTER TABLE public.admin_websites_needed 
ADD COLUMN username TEXT,
ADD COLUMN password TEXT;