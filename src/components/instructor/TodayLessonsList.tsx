import { format, parse, addMinutes } from "date-fns";
import { motion } from "framer-motion";
import { Clock, CalendarOff } from "lucide-react";
import { Link } from "react-router-dom";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { Badge } from "@/components/ui/badge";

interface TodayLessonsListProps {
  lessons: TodayLesson[];
  className?: string;
}

const typeColors: Record<string, string> = {
  Standard: "#007AFF",
  "Test Prep": "#FF9500",
  "Mock Test": "#AF52DE",
  Motorway: "#FF2D55",
  Refresher: "#5AC8FA",
  "Pass Plus": "#34C759",
};

export function TodayLessonsList({ lessons, className = "" }: TodayLessonsListProps) {
  const formatTime = (time: string) => {
    try {
      return format(parse(time, "HH:mm:ss", new Date()), "HH:mm");
    } catch {
      return time.substring(0, 5);
    }
  };

  const getEndTime = (startTime: string, duration: number) => {
    try {
      return format(addMinutes(parse(startTime, "HH:mm:ss", new Date()), duration), "HH:mm");
    } catch {
      return "";
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[18px] font-bold text-foreground">Today's Lessons</h3>
        <span
          className="text-[14px] font-semibold px-2.5 py-0.5"
          style={{
            color: "#AEAEB2",
            backgroundColor: "#F0F0F4",
            borderRadius: 10,
          }}
        >
          {lessons.length}
        </span>
      </div>

      {/* Empty state */}
      {lessons.length === 0 ? (
        <div
          className="bg-card rounded-[14px] p-8 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <CalendarOff className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-[16px] font-semibold text-foreground">No lessons today</p>
          <p className="text-[13px] text-muted-foreground mt-1">Enjoy your day off!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const borderColor = typeColors[lesson.lessonType] || typeColors.Standard;
            const isCancelled = lesson.status === "cancelled";
            const isPaid = lesson.paymentStatus === "paid";

            return (
              <Link key={lesson.id} to={lesson.pupilId ? `/instructor/pupils/${lesson.pupilId}` : "/instructor/pupils"}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isCancelled ? 0.5 : 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="p-4 active:scale-[0.98] transition-transform dark:!bg-[rgba(28,28,30,0.75)] dark:!border-[rgba(255,255,255,0.1)]"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRadius: 22,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderLeft: `4px solid ${borderColor}`,
                  }}
                >
                  {/* Time */}
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[13px]">
                      {formatTime(lesson.startTime)} – {getEndTime(lesson.startTime, lesson.durationMinutes)}
                    </span>
                  </div>

                  {/* Type badge + pupil name */}
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="border-0 text-[11px] font-medium px-2 py-0.5"
                      style={{
                        backgroundColor: `${borderColor}1A`,
                        color: borderColor,
                      }}
                    >
                      {lesson.lessonType}
                    </Badge>
                  </div>
                  <p className="text-[16px] font-semibold text-foreground leading-tight">
                    {lesson.pupilName}
                  </p>

                  {/* Bottom row: amount + status */}
                  <div className="flex items-center justify-between mt-2">
                    {lesson.amountDue != null && (
                      <span className="text-[14px] font-bold text-foreground">
                        £{lesson.amountDue}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium px-2 py-0.5 border-0 ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {isPaid ? "Done" : "Unpaid"}
                    </Badge>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
