
-- Add engine diagnostic columns to gps_devices
ALTER TABLE public.gps_devices
  ADD COLUMN IF NOT EXISTS last_fuel_percent numeric,
  ADD COLUMN IF NOT EXISTS last_battery_voltage numeric,
  ADD COLUMN IF NOT EXISTS last_coolant_temp_c numeric,
  ADD COLUMN IF NOT EXISTS last_engine_hours numeric,
  ADD COLUMN IF NOT EXISTS last_ecu_odometer_km numeric,
  ADD COLUMN IF NOT EXISTS last_tire_pressure_json jsonb,
  ADD COLUMN IF NOT EXISTS last_fault_codes jsonb,
  ADD COLUMN IF NOT EXISTS last_diagnostics_at timestamptz;
