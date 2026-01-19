-- Add calendar color preferences to instructors table
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS calendar_colors JSONB DEFAULT '{"lesson": "#10b981", "lesson_unpaid": "#ef4444", "block_personal": "#3b82f6", "block_break": "#f59e0b", "block_meeting": "#8b5cf6", "external": "#6b7280"}'::jsonb;