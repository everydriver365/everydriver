-- Add vehicle_id column to compliance_reminders to track vehicle-specific reminders
ALTER TABLE public.compliance_reminders
ADD COLUMN vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE CASCADE;

-- Add index for vehicle lookups
CREATE INDEX idx_compliance_reminders_vehicle_id ON public.compliance_reminders(vehicle_id);

-- Add comment for clarity
COMMENT ON COLUMN public.compliance_reminders.vehicle_id IS 'Optional: links reminder to a specific vehicle for vehicle compliance reminders';