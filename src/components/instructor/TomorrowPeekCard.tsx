import { useState } from "react";
import { format, parse, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  PoundSterling,
  CheckSquare,
  Bell,
  MapPin,
  User,
} from "lucide-react";
import planAheadIcon from "@/assets/plan-ahead-icon.png";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useInstructorTodos } from "@/hooks/useInstructorTodos";

interface TomorrowLesson {
  id: string;
  pupilName: string;
  startTime: string;
  durationMinutes: number;
  pickupPostcode?: string | null;
}

interface TomorrowPeekCardProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstLessonTime: string | null;
  lessons?: TomorrowLesson[];
  instructorId?: string;
  className?: string;
}

export function TomorrowPeekCard({
  lessonCount,
  totalHours,
  expectedEarnings,
  firstLessonTime,
  lessons = [],
  instructorId,
  className = "",
}: TomorrowPeekCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: allTodos = [] } = useInstructorTodos(instructorId);

  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const tomorrowTodos = allTodos.filter(
    (t) => t.due_date && t.due_date.startsWith(tomorrow) && !t.is_completed
  );

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  if (lessonCount === 0 && tomorrowTodos.length === 0) return null;

  const tomorrowLabel = format(addDays(new Date(), 1), "EEEE");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <div className="rounded-none shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card overflow-hidden">
        {/* Header — Quick Access tile style */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3.5 py-3.5 flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-none overflow-hidden shrink-0">
            <img src={planAheadIcon} alt="Plan Ahead" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-semibold text-foreground leading-tight">Plan Ahead</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {tomorrowLabel} · {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} · £{expectedEarnings}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lessonCount > 0 && (
              <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded px-2 py-0.5">
                {totalHours}h
              </span>
            )}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !isExpanded && "-rotate-90")} />
          </div>
        </button>

        {/* Collapsible content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Summary stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/40 rounded-none p-2.5 text-center">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-foreground">{totalHours}h</p>
                    <p className="text-[10px] text-muted-foreground">Teaching</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-none p-2.5 text-center">
                    <PoundSterling className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-emerald-600">£{expectedEarnings}</p>
                    <p className="text-[10px] text-muted-foreground">Expected</p>
                  </div>
                  <div className="bg-muted/40 rounded-none p-2.5 text-center">
                    <CheckSquare className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-foreground">{tomorrowTodos.length}</p>
                    <p className="text-[10px] text-muted-foreground">Tasks</p>
                  </div>
                </div>

                {/* Lessons list */}
                {lessons.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Lessons</p>
                    <div className="space-y-1.5">
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2.5 py-2.5 px-3 bg-muted/30 rounded-none"
                        >
                          <div className="w-1 h-8 rounded-full bg-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground shrink-0" />
                              {lesson.pupilName}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(lesson.startTime)} · {lesson.durationMinutes}min
                              {lesson.pickupPostcode && (
                                <>
                                  <span className="mx-0.5">·</span>
                                  <MapPin className="h-2.5 w-2.5" />
                                  {lesson.pickupPostcode}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* To-dos due tomorrow */}
                {tomorrowTodos.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tasks Due</p>
                    <div className="space-y-1.5">
                      {tomorrowTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-2.5 py-2.5 px-3 bg-muted/30 rounded-none"
                        >
                          <div className="w-1 h-6 rounded-full bg-violet-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{todo.title}</p>
                          </div>
                          <Bell className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View full schedule button */}
                <button
                  onClick={() => navigate("/instructor/schedule")}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary hover:bg-muted/30 rounded-none transition-colors"
                >
                  View full schedule
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
