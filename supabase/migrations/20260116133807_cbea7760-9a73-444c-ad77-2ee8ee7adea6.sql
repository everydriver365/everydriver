-- Add NPI Payment Page logo setting
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, label, description, display_order)
VALUES 
  ('npi_merchant_logo', NULL, 'image', 'Payment Page Logo', 'Logo displayed on the hosted payment page', 52)
ON CONFLICT (setting_key) DO NOTHING;