
-- Temporary anon read policies for Rork app testing
-- Scoped to single instructor ID only

CREATE POLICY "temp_rork_anon_read" ON public.scheduled_lessons
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.pupils
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.payment_history
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.instructor_expenses
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.mileage_logs
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.lesson_telematics
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.telematics_gps_points
FOR SELECT TO anon USING (
  telematics_id IN (
    SELECT id FROM public.lesson_telematics 
    WHERE instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid
  )
);

CREATE POLICY "temp_rork_anon_read" ON public.telematics_alerts
FOR SELECT TO anon USING (
  telematics_id IN (
    SELECT id FROM public.lesson_telematics 
    WHERE instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid
  )
);

CREATE POLICY "temp_rork_anon_read" ON public.clock_entries
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.live_pupil_positions
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);

CREATE POLICY "temp_rork_anon_read" ON public.instructor_todos
FOR SELECT TO anon USING (instructor_id = 'b7987d5e-348f-4047-a8d4-ee71fab1f01d'::uuid);
