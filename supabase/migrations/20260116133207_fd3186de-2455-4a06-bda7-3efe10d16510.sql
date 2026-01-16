-- Add NPI Payment Page customization settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, label, description, display_order)
VALUES 
  ('npi_merchant_name', NULL, 'text', 'Payment Page Business Name', 'Displayed on the hosted payment page', 50),
  ('npi_brand_color', '#3b82f6', 'color', 'Payment Page Brand Color', 'Primary color for payment form styling', 51)
ON CONFLICT (setting_key) DO NOTHING;