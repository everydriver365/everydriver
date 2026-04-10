
CREATE INDEX IF NOT EXISTS idx_pupils_instructor_id ON public.pupils (instructor_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_instructor_date ON public.scheduled_lessons (instructor_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_telematics_gps_points_session_time ON public.telematics_gps_points (telematics_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_payment_history_pupil ON public.payment_history (pupil_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telematics_alerts_session ON public.telematics_alerts (telematics_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gps_devices_instructor ON public.gps_devices (instructor_id);
CREATE INDEX IF NOT EXISTS idx_live_positions_instructor ON public.live_pupil_positions (instructor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_telematics_instructor_start ON public.lesson_telematics (instructor_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents (status, created_at DESC);
