-- Add vehicle health columns to traccar_devices
ALTER TABLE public.traccar_devices 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_battery_percent INTEGER,
ADD COLUMN IF NOT EXISTS last_ignition_status BOOLEAN;

-- Create index for faster lookups by vehicle
CREATE INDEX IF NOT EXISTS idx_traccar_devices_vehicle_id ON public.traccar_devices(vehicle_id);

-- Create RPC to atomically increment vehicle odometer
CREATE OR REPLACE FUNCTION public.increment_vehicle_odometer(
  p_vehicle_id UUID,
  p_distance_km NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE public.instructor_vehicles
  SET current_odometer_km = COALESCE(current_odometer_km, 0) + p_distance_km
  WHERE id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;