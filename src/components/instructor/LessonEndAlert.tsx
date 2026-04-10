import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverdueLesson } from "@/hooks/useLessonEndAlert";
import { format, parse } from "date-fns";

interface LessonEndAlertProps {
  lesson: OverdueLesson | null;
  onComplete: (lesson: OverdueLesson) => void;
  onDismiss: (lessonId: string) => void;
}

export function LessonEndAlert({ lesson, onComplete, onDismiss }: LessonEndAlertProps) {
  if (!lesson) return null;

  const formattedTime = (() => {
    try {
      return format(parse(lesson.startTime, "HH:mm:ss", new Date()), "h:mm a");
    } catch {
      return lesson.startTime;
    }
  })();

  return (
    <AnimatePresence>
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-full max-w-sm bg-background rounded-none shadow-2xl border-2 border-amber-500 overflow-hidden"
        >
          {/* Amber header band */}
          <div className="bg-amber-500 px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Lesson Ended</p>
              <h3 className="text-lg font-bold text-white leading-tight">
                {lesson.pupilName}
              </h3>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="text-sm text-foreground leading-relaxed">
              Your {lesson.durationMinutes} min lesson at {formattedTime} has finished. Complete the end-of-lesson steps to record payment, update skills, and book next.
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 space-y-2">
            <Button
              onClick={() => onComplete(lesson)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-12 text-base"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Lesson
            </Button>
            <Button
              variant="ghost"
              onClick={() => onDismiss(lesson.id)}
              className="w-full text-muted-foreground h-10"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
