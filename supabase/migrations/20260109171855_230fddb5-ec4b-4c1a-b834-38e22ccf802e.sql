-- Telematics tracking tables

-- Table for tracking lesson routes and GPS data
CREATE TABLE public.lesson_telematics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  pupil_id UUID,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_distance_km DECIMAL(10,2) DEFAULT 0,
  avg_speed_kmh DECIMAL(5,2),
  max_speed_kmh DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for GPS location points during lessons
CREATE TABLE public.telematics_gps_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telematics_id UUID NOT NULL REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed_kmh DECIMAL(5,2),
  heading DECIMAL(5,2),
  altitude_m DECIMAL(8,2),
  accuracy_m DECIMAL(6,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for driving behavior events (harsh braking, acceleration, etc.)
CREATE TABLE public.driving_behavior_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telematics_id UUID NOT NULL REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('harsh_brake', 'harsh_acceleration', 'sharp_turn', 'speeding', 'smooth_stop', 'good_acceleration')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  speed_at_event DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Table for vehicle health/mileage tracking
CREATE TABLE public.vehicle_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  current_odometer_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_service_date DATE,
  next_service_due_km DECIMAL(10,2),
  next_service_due_date DATE,
  fuel_efficiency_avg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for mileage log entries
CREATE TABLE public.mileage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  vehicle_health_id UUID REFERENCES public.vehicle_health(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_odometer_km DECIMAL(10,2) NOT NULL,
  end_odometer_km DECIMAL(10,2) NOT NULL,
  distance_km DECIMAL(10,2) GENERATED ALWAYS AS (end_odometer_km - start_odometer_km) STORED,
  fuel_added_liters DECIMAL(6,2),
  fuel_cost DECIMAL(8,2),
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lesson_telematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telematics_gps_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driving_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_telematics
CREATE POLICY "Instructors can view their own telematics" 
ON public.lesson_telematics FOR SELECT 
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can insert their own telematics" 
ON public.lesson_telematics FOR INSERT 
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update their own telematics" 
ON public.lesson_telematics FOR UPDATE 
USING (instructor_id = auth.uid());

-- RLS Policies for telematics_gps_points
CREATE POLICY "Instructors can view GPS points for their telematics" 
ON public.telematics_gps_points FOR SELECT 
USING (telematics_id IN (SELECT id FROM public.lesson_telematics WHERE instructor_id = auth.uid()));

CREATE POLICY "Instructors can insert GPS points for their telematics" 
ON public.telematics_gps_points FOR INSERT 
WITH CHECK (telematics_id IN (SELECT id FROM public.lesson_telematics WHERE instructor_id = auth.uid()));

-- RLS Policies for driving_behavior_events
CREATE POLICY "Instructors can view their behavior events" 
ON public.driving_behavior_events FOR SELECT 
USING (telematics_id IN (SELECT id FROM public.lesson_telematics WHERE instructor_id = auth.uid()));

CREATE POLICY "Instructors can insert behavior events" 
ON public.driving_behavior_events FOR INSERT 
WITH CHECK (telematics_id IN (SELECT id FROM public.lesson_telematics WHERE instructor_id = auth.uid()));

-- RLS Policies for vehicle_health
CREATE POLICY "Instructors can view their vehicle health" 
ON public.vehicle_health FOR SELECT 
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can manage their vehicle health" 
ON public.vehicle_health FOR ALL 
USING (instructor_id = auth.uid());

-- RLS Policies for mileage_log
CREATE POLICY "Instructors can view their mileage log" 
ON public.mileage_log FOR SELECT 
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can manage their mileage log" 
ON public.mileage_log FOR ALL 
USING (instructor_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_lesson_telematics_instructor ON public.lesson_telematics(instructor_id);
CREATE INDEX idx_lesson_telematics_lesson ON public.lesson_telematics(lesson_id);
CREATE INDEX idx_gps_points_telematics ON public.telematics_gps_points(telematics_id);
CREATE INDEX idx_gps_points_recorded ON public.telematics_gps_points(recorded_at);
CREATE INDEX idx_behavior_events_telematics ON public.driving_behavior_events(telematics_id);
CREATE INDEX idx_vehicle_health_instructor ON public.vehicle_health(instructor_id);
CREATE INDEX idx_mileage_log_instructor ON public.mileage_log(instructor_id);

-- Enable realtime for GPS tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.telematics_gps_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driving_behavior_events;