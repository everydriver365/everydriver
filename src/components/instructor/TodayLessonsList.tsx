import { useState } from "react";
import { format, parse, addMinutes } from "date-fns";
import { motion } from "framer-motion";
import { CalendarOff, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { Badge } from "@/components/ui/badge";
import { PupilAvatar } from "./PupilAvatar";
import { LessonRouteRecorder } from "./LessonRouteRecorder";

interface TodayLessonsListProps {
  lessons: TodayLesson[];
  instructorId: string;
  className?: string;
}

const typeColors: Record<string, { bg: string; text: string }> = {
  Standard: { bg: "bg-primary/10", text: "text-primary" },
  "Test Prep": { bg: "bg-amber-500/10", text: "text-amber-600" },
  "Mock Test": { bg: "bg-violet-500/10", text: "text-violet-600" },
  Motorway: { bg: "bg-rose-500/10", text: "text-rose-600" },
  Refresher: { bg: "bg-sky-500/10", text: "text-sky-600" },
  "Pass Plus": { bg: "bg-emerald-500/10", text: "text-emerald-600" },
};

export function TodayLessonsList({ lessons, instructorId, className = "" }: TodayLessonsListProps) {
  const [recordingLessonId, setRecordingLessonId] = useState<string | null>(null);
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
          className="text-[14px] font-semibold px-2.5 py-0.5 text-muted-foreground bg-muted"
          style={{ borderRadius: 10 }}
        >
          {lessons.length}
        </span>
      </div>

      {/* Empty state */}
      {lessons.length === 0 ? (
        <div
          className="bg-card rounded-2xl shadow-lift p-8 flex flex-col items-center justify-center text-center"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <CalendarOff className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-[16px] font-semibold text-foreground">No lessons today</p>
          <p className="text-[13px] text-muted-foreground mt-1">Enjoy your day off!</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline track */}
          <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-border rounded-full" />

          <div className="space-y-0">
            {lessons.map((lesson, idx) => {
              const isCancelled = lesson.status === "cancelled";
              const isPaid = lesson.paymentStatus === "paid";
              const colors = typeColors[lesson.lessonType] || typeColors.Standard;
              const isLast = idx === lessons.length - 1;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isCancelled ? 0.5 : 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  {/* Time label + dot row */}
                  <div className="flex items-center gap-2 pl-0 mb-1.5">
                    <div className="relative flex items-center justify-center w-[38px] shrink-0">
                      {/* Timeline dot */}
                      <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-background shadow-sm z-10" />
                    </div>
                    <span className="text-[12px] font-semibold text-muted-foreground tracking-wide">
                      {formatTime(lesson.startTime)}
                    </span>
                  </div>

                   {/* Lesson card — offset to the right of the timeline */}
                    <div className="pl-0 mb-4 flex gap-2">
                      {/* Spacer for timeline column */}
                      <div className="w-[38px] shrink-0" />

                      <div className="flex-1 min-w-0">
                        {/* Card */}
                        <Link
                          to={lesson.pupilId ? `/instructor/pupils/${lesson.pupilId}` : "/instructor/pupils"}
                          className="block"
                        >
                          <div
                            className="p-3 active:scale-[0.98] transition-transform bg-card dark:bg-card border border-border"
                            style={{ borderRadius: 16 }}
                          >
                            {/* Top row: Avatar + Name + Type badge */}
                            <div className="flex items-center gap-2.5">
                              <PupilAvatar
                                name={lesson.pupilName}
                                imageUrl={lesson.pupilProfileImageUrl}
                                size="sm"
                              />
                              <p className="text-[15px] font-semibold text-foreground leading-tight flex-1 truncate">
                                {lesson.pupilName}
                              </p>
                              <Badge
                                variant="outline"
                                className={`${colors.bg} ${colors.text} border-0 text-[11px] font-medium px-2 py-0.5 shrink-0`}
                              >
                                {lesson.lessonType}
                              </Badge>
                            </div>

                            {/* Bottom row: time range + amount + status + GPS */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[12px] text-muted-foreground">
                                {formatTime(lesson.startTime)} – {getEndTime(lesson.startTime, lesson.durationMinutes)}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setRecordingLessonId(recordingLessonId === lesson.id ? null : lesson.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
                                  style={{
                                    background: recordingLessonId === lesson.id ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                                    color: recordingLessonId === lesson.id ? "#DC2626" : "#16A34A",
                                  }}
                                >
                                  <Navigation className="h-[10px] w-[10px]" />
                                  GPS
                                </button>
                                {lesson.amountDue != null && (
                                  <span className="text-[13px] font-bold text-foreground">
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
                            </div>
                          </div>
                        </Link>

                        {/* Route recorder below the card */}
                        {recordingLessonId === lesson.id && (
                          <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <LessonRouteRecorder
                              instructorId={instructorId}
                              pupilId={lesson.pupilId}
                              lessonId={lesson.id}
                              onRouteRecorded={() => setRecordingLessonId(null)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                  {/* End time marker for last lesson */}
                  {isLast && (
                    <div className="flex items-center gap-2 pl-0">
                      <div className="relative flex items-center justify-center w-[38px] shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 border-2 border-background z-10" />
                      </div>
                      <span className="text-[12px] text-muted-foreground">
                        {getEndTime(lesson.startTime, lesson.durationMinutes)} · Day ends
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
