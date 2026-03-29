
-- Temporary anon SELECT policies for Rork mobile app (scoped to hardcoded instructor)
-- GPS Devices
CREATE POLICY "temp_rork_anon_read_gps_devices" ON public.gps_devices
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

-- Geotab Driver Events
CREATE POLICY "temp_rork_anon_read_geotab_driver_events" ON public.geotab_driver_events
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

-- Geotab Fuel Usage
CREATE POLICY "temp_rork_anon_read_geotab_fuel_usage" ON public.geotab_fuel_usage
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

-- Geotab Impact Events (SELECT + UPDATE for acknowledging)
CREATE POLICY "temp_rork_anon_read_geotab_impact_events" ON public.geotab_impact_events
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_update_geotab_impact_events" ON public.geotab_impact_events
FOR UPDATE TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid)
WITH CHECK (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

-- Geotab Fault Codes
CREATE POLICY "temp_rork_anon_read_geotab_fault_codes" ON public.geotab_fault_codes
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

-- Conversations
CREATE POLICY "temp_rork_anon_read_conversations" ON public.conversations
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

-- Messages (via conversation subquery)
CREATE POLICY "temp_rork_anon_read_messages" ON public.messages
FOR SELECT TO anon USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid
  )
);

-- GPS Devices UPDATE for Rork (push tokens, metadata)
CREATE POLICY "temp_rork_anon_update_gps_devices" ON public.gps_devices
FOR UPDATE TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid)
WITH CHECK (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);
