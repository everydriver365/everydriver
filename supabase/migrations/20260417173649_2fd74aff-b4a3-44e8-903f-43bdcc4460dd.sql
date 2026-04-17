-- Attach auto_log_mileage trigger to lesson_telematics
DROP TRIGGER IF EXISTS trg_auto_log_mileage ON public.lesson_telematics;
CREATE TRIGGER trg_auto_log_mileage
AFTER UPDATE ON public.lesson_telematics
FOR EACH ROW
EXECUTE FUNCTION public.auto_log_mileage();