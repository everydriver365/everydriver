
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS course_status text NOT NULL DEFAULT 'active';

-- Database function to award £50 bonus when course is marked complete
CREATE OR REPLACE FUNCTION public.award_course_completion_bonus(p_pupil_id uuid, p_instructor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_status text;
  v_pupil_name text;
BEGIN
  -- Check current status to prevent double-awarding
  SELECT course_status, name INTO v_current_status, v_pupil_name
  FROM public.pupils WHERE id = p_pupil_id;
  
  IF v_current_status = 'completed' THEN
    RETURN false; -- Already completed
  END IF;
  
  -- Mark course as completed
  UPDATE public.pupils SET course_status = 'completed' WHERE id = p_pupil_id;
  
  -- Award £50 bonus to instructor
  UPDATE public.instructors 
  SET bonus_earned = COALESCE(bonus_earned, 0) + 50 
  WHERE id = p_instructor_id;
  
  -- Record in payment_history for audit trail
  INSERT INTO public.payment_history (pupil_id, instructor_id, amount, payment_method, notes)
  VALUES (p_pupil_id, p_instructor_id, 50, 'Course Bonus', 'Course completion bonus for ' || COALESCE(v_pupil_name, 'pupil'));
  
  RETURN true;
END;
$$;
