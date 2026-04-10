import { useState } from "react";
import { format, parse, addMinutes, addDays } from "date-fns";
import { motion } from "framer-motion";
import { Clock, MapPin, CalendarX, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PupilAvatar } from "./PupilAvatar";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";

interface TodayScheduleAgendaProps {
  todayLessons: TodayLesson[];
  tomorrowLessons: TodayLesson[];
  className?: string;
}

const fmtTime24 = (t: string) => {
  try { return format(parse(t, "HH:mm:ss", new Date()), "HH:mm"); } catch { return t?.substring(0, 5); }
};
const fmtTime12 = (t: string) => {
  try { return format(parse(t, "HH:mm:ss", new Date()), "h:mm a"); } catch { return t?.substring(0, 5); }
};

const typeColors: Record<string, string> = {
  Standard: "bg-primary/10 text-primary",
  "Test Prep": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Mock Test": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Motorway: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Refresher: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Pass Plus": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

function SummaryBar({ lessons }: { lessons: TodayLesson[] }) {
  const totalMins = lessons.reduce((s, l) => s + l.durationMinutes, 0);
  const totalEarnings = lessons.reduce((s, l) => s + (l.amountDue || 0), 0);
  const paid = lessons.filter(l => l.paymentStatus === "paid").length;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
      <span className="font-semibold text-foreground">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
      <span>•</span>
      <span>{(totalMins / 60).toFixed(1)}h</span>
      <span>•</span>
      <span>£{Math.round(totalEarnings)}</span>
      <span>•</span>
      <span className="text-emerald-600 dark:text-emerald-400">{paid}/{lessons.length} paid</span>
    </div>
  );
}

function AgendaList({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CalendarX className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">No lessons scheduled</p>
      </div>
    );
  }

  return (
    <div>
      <SummaryBar lessons={lessons} />
      <div className="space-y-1.5">
        {lessons.map((l, i) => {
          const done = l.status === "completed";
          return (
            <Link key={l.id} to={l.pupilId ? `/instructor/pupils/${l.pupilId}` : "/instructor/pupils"}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-stretch gap-3 rounded-none p-2.5 transition-colors active:scale-[0.98] ${done ? "bg-muted/50" : "bg-card border shadow-sm"}`}
              >
                {/* Time column */}
                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                  <span className="text-base font-bold text-foreground leading-none">{fmtTime24(l.startTime)}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{l.durationMinutes}m</span>
                </div>

                {/* Divider */}
                <div className="w-0.5 bg-primary/20 rounded-full shrink-0" />

                {/* Avatar + Details */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 py-0.5">
                  <PupilAvatar
                    name={l.pupilName}
                    imageUrl={l.pupilProfileImageUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-sm truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {l.pupilName}
                      </span>
                      {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {l.pickupPostcode && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />{l.pickupPostcode}
                        </span>
                      )}
                      <Badge variant="outline" className={`${typeColors[l.lessonType] || typeColors.Standard} border-0 text-[10px] px-1.5 py-0`}>
                        {l.lessonType}
                      </Badge>
                      <span className={`ml-auto ${l.paymentStatus === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        £{l.amountDue || 0}
                      </span>
                    </div>
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

export function TodayScheduleAgenda({ todayLessons, tomorrowLessons, className = "" }: TodayScheduleAgendaProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-foreground">Schedule</h3>
        <Link to="/instructor/schedule" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          See all
        </Link>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="today" className="flex-1 text-xs">
            Today · {format(new Date(), "EEE d")}
          </TabsTrigger>
          <TabsTrigger value="tomorrow" className="flex-1 text-xs">
            Tomorrow · {format(addDays(new Date(), 1), "EEE d")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <AgendaList lessons={todayLessons} />
        </TabsContent>
        <TabsContent value="tomorrow">
          <AgendaList lessons={tomorrowLessons} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
