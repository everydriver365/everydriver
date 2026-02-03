-- Add odometer and accumulator tracking to traccar_devices
ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  gpsgate_odometer_m numeric;

ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  gpsgate_engine_hours_s integer;

ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  last_gpsgate_odometer_m numeric;

ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  daily_start_odometer_m numeric;

ALTER TABLE traccar_devices ADD COLUMN IF NOT EXISTS 
  daily_start_date date;

-- Add fuel cost tracking to mileage_logs
ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS 
  estimated_fuel_cost_gbp numeric;

ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS 
  fuel_litres_used numeric;