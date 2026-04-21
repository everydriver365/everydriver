import { format, parse, addMinutes, isAfter } from "date-fns";
import { motion } from "framer-motion";
import { Clock, MapPin, PoundSterling, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { Badge } from "@/components/ui/badge";
import { PupilAvatar } from "./PupilAvatar";

interface TodayMiniTimelineProps {
  lessons: TodayLesson[];
  className?: string;
}

const lessonTypeColors: Record<string, { bg: string; text: string }> = {
  "Standard": { bg: "bg-primary/10", text: "text-primary" },
  "Test Prep": { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  "Mock Test": { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  "Motorway": { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  "Refresher": { bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-400" },
  "Pass Plus": { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400" },
};

type LessonState = "done" | "overdue" | "next" | "upcoming";

function getLessonStates(lessons: TodayLesson[]): Map<string, LessonState> {
  const now = new Date();
  const states = new Map<string, LessonState>();
  let foundNext = false;

  for (const l of lessons) {
    if (l.status === "completed") {
      states.set(l.id, "done");
      continue;
    }
    try {
      const start = parse(l.startTime, "HH:mm:ss", new Date());
      const end = addMinutes(start, l.durationMinutes);
      if (isAfter(now, end)) {
        states.set(l.id, "overdue");
        continue;
      }
    } catch {
      // fall through
    }
    if (!foundNext) {
      states.set(l.id, "next");
      foundNext = true;
    } else {
      states.set(l.id, "upcoming");
    }
  }
  return states;
}

export function TodayMiniTimeline({ lessons, className = "" }: TodayMiniTimelineProps) {
  if (lessons.length === 0) return null;

  const states = getLessonStates(lessons);

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "HH:mm");
    } catch {
      return time.substring(0, 5);
    }
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    try {
      const parsed = parse(startTime, "HH:mm:ss", new Date());
      const end = addMinutes(parsed, durationMinutes);
      return format(end, "HH:mm");
    } catch {
      return "";
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-foreground">Today's Schedule</h3>
        <Link to="/instructor/schedule" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          See all
        </Link>
      </div>

      {/* Lesson Cards */}
      <div className="space-y-3">
        {lessons.map((lesson, idx) => {
          const typeColors = lessonTypeColors[lesson.lessonType] || lessonTypeColors["Standard"];
          const isPaid = lesson.paymentStatus === "paid";
          const state = states.get(lesson.id) || "upcoming";
          const isDone = state === "done";
          const isNext = state === "next";
          const isOverdue = state === "overdue";

          return (
            <Link key={lesson.id} to={lesson.pupilId ? `/instructor/pupils/${lesson.pupilId}` : "/instructor/pupils"}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="overflow-hidden active:scale-[0.98] transition-transform dark:!bg-[rgba(28,28,30,0.75)] dark:!border-[rgba(255,255,255,0.1)]"
                style={{
                  background: isNext ? "rgba(10,122,255,0.06)" : "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderRadius: 22,
                  boxShadow: isNext
                    ? "0 4px 24px rgba(10,122,255,0.12), inset 0 1px 0 rgba(255,255,255,0.8)"
                    : "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                  border: isNext ? "1.5px solid rgba(10,122,255,0.3)" : "1px solid rgba(255,255,255,0.5)",
                  opacity: isDone ? 0.55 : 1,
                }}
              >
                <div className="p-4">
                  {/* Top row: Avatar + Name + Status/Type Badge */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <PupilAvatar
                      name={lesson.pupilName}
                      imageUrl={lesson.pupilProfileImageUrl}
                      size="sm"
                    />
                    <h4 className={`text-[15px] font-semibold text-foreground truncate flex-1 ${isDone ? "line-through" : ""}`}>
                      {lesson.pupilName}
                    </h4>
                    {isDone && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#30D158" }} />}
                    {isNext && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-[11px] font-bold px-2 py-0.5 shrink-0 uppercase tracking-wide">
                        Next
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`${typeColors.bg} ${typeColors.text} border-0 text-[11px] font-medium px-2 py-0.5 shrink-0`}
                    >
                      {lesson.lessonType}
                    </Badge>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatTime(lesson.startTime)} - {getEndTime(lesson.startTime, lesson.durationMinutes)}</span>
                  </div>

                  {/* Location */}
                  {(lesson.pickupLocation || lesson.pickupPostcode) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{lesson.pickupLocation || lesson.pickupPostcode}</span>
                    </div>
                  )}

                  {/* Price + Payment Status + Overdue nudge */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      {lesson.amountDue != null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <PoundSterling className="h-3.5 w-3.5 shrink-0" />
                          <span>£{lesson.amountDue}</span>
                        </div>
                      )}
                      {isDone && (
                        <span className="text-[11px] font-semibold" style={{ color: "#30D158" }}>✓ Done</span>
                      )}
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#FF9500" }}>
                          <Clock className="h-3 w-3" />End lesson
                          <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium px-2 py-0.5 border-0 ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
