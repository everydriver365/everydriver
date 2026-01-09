-- Add cancellation policy fields to instructors table
ALTER TABLE public.instructors
ADD COLUMN cancellation_policy_hours integer DEFAULT 24,
ADD COLUMN cancellation_charge_percent integer DEFAULT 100,
ADD COLUMN cancellation_policy_text text DEFAULT 'Full charge applies for cancellations made less than 24 hours before the lesson.';