import { format, parse } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, Check } from "lucide-react";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";

interface TodayMiniTimelineProps {
  lessons: TodayLesson[];
  className?: string;
}

export function TodayMiniTimeline({ lessons, className = "" }: TodayMiniTimelineProps) {
  if (lessons.length <= 1) return null;

  const currentTime = format(new Date(), "HH:mm:ss");

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  const isCompleted = (lesson: TodayLesson) => {
    const endMinutes = timeToMinutes(lesson.startTime) + lesson.durationMinutes;
    const nowMinutes = timeToMinutes(currentTime);
    return nowMinutes >= endMinutes || lesson.status === "completed";
  };

  const isCurrent = (lesson: TodayLesson) => {
    const startMin = timeToMinutes(lesson.startTime);
    const endMin = startMin + lesson.durationMinutes;
    const nowMin = timeToMinutes(currentTime);
    return nowMin >= startMin && nowMin < endMin;
  };

  return (
    <div className={className}>
      <div className="bg-card shadow-xl overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-[#0075c9] via-[#0068b3] to-[#005a9e] px-4 py-3 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Today's Schedule
            </h3>
          </div>
        </div>
        <div className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-3">
            {lessons.map((lesson, idx) => {
              const completed = isCompleted(lesson);
              const current = isCurrent(lesson);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 relative"
                >
                  {/* Dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                      completed
                        ? "bg-emerald-500 border-emerald-500"
                        : current
                        ? "bg-primary border-primary animate-pulse"
                        : "bg-white border-border"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : (
                      <span
                        className={`text-[8px] font-bold ${
                          current ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {lesson.pupilInitials.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          completed
                            ? "text-muted-foreground line-through"
                            : current
                            ? "text-foreground font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        {lesson.pupilName}
                      </p>
                    </div>
                    <span
                      className={`text-xs flex-shrink-0 ml-2 ${
                        completed
                          ? "text-muted-foreground"
                          : current
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(lesson.startTime)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
