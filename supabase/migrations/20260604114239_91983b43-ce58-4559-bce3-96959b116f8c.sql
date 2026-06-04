GRANT INSERT ON public.booking_enquiries TO anon;
GRANT INSERT, SELECT, UPDATE ON public.booking_enquiries TO authenticated;
GRANT ALL ON public.booking_enquiries TO service_role;