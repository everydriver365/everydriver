import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import {
  Clock, MapPin, Users, PoundSterling, AlertTriangle,
  CheckCircle2, ChevronRight, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManifestLesson {
  id: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  pickup_location: string | null;
  status: string;
  pupil: { name: string; phone: string | null } | null;
  price: number | null;
}

interface ManifestPayment {
  id: string;
  pupil_name: string;
  amount: number;
  status: string;
}

interface DailyManifestProps {
  instructorId: string;
}

export function DailyManifest({ instructorId }: DailyManifestProps) {
  const [lessons, setLessons] = useState<ManifestLesson[]>([]);
  const [overdueBalances, setOverdueBalances] = useState<Array<{ id: string; name: string; balance: number }>>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const dayLabel = format(new Date(), "EEEE d MMMM");

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        // Fetch today's lessons
        const { data: lessonData } = await supabase
          .from("scheduled_lessons")
          .select("id, start_time, end_time, duration_minutes, pickup_location, status, price, pupil:pupils!inner(name, phone)")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .order("start_time", { ascending: true });

        if (lessonData) {
          setLessons(lessonData as any[]);
        }

        // Fetch pupils with negative balances
        const { data: debtors } = await supabase
          .from("pupils")
          .select("id, name, account_balance")
          .eq("instructor_id", instructorId)
          .is("deleted_at", null)
          .lt("account_balance", 0)
          .order("account_balance", { ascending: true })
          .limit(5);

        if (debtors) {
          setOverdueBalances(debtors.map(d => ({ id: d.id, name: d.name, balance: Math.abs(d.account_balance || 0) })));
        }
      } catch (error) {
        console.error("Error loading manifest:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManifest();
  }, [instructorId, today]);

  const totalEarnings = lessons
    .filter(l => l.status !== "cancelled")
    .reduce((sum, l) => sum + (l.price || 0), 0);

  const completedCount = lessons.filter(l => l.status === "completed").length;
  const upcomingCount = lessons.filter(l => l.status === "scheduled" || l.status === "confirmed").length;

  const now = format(new Date(), "HH:mm");

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today at a Glance
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{dayLabel}</p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{lessons.length}</p>
              <p className="text-muted-foreground">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">£{totalEarnings}</p>
              <p className="text-muted-foreground">Expected</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {lessons.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            No lessons scheduled today
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y">
              {lessons.map((lesson, index) => {
                const isPast = lesson.start_time && lesson.start_time < now;
                const isCompleted = lesson.status === "completed";
                const isCancelled = lesson.status === "cancelled";
                const isNext = !isPast && !isCompleted && !isCancelled && 
                  lessons.filter(l => l.start_time && l.start_time < now && l.status !== "cancelled").length === index;

                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors",
                      isNext && "bg-primary/5 border-l-2 border-l-primary",
                      isCancelled && "opacity-50",
                      isCompleted && "bg-muted/20",
                    )}
                  >
                    {/* Time column */}
                    <div className="w-14 shrink-0 text-center">
                      <p className={cn(
                        "text-sm font-semibold",
                        isCompleted ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {lesson.start_time?.slice(0, 5) || "TBC"}
                      </p>
                      {lesson.end_time && (
                        <p className="text-[10px] text-muted-foreground">{lesson.end_time.slice(0, 5)}</p>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isCancelled ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className={cn("h-4 w-4", isNext ? "text-primary" : "text-muted-foreground/40")} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isCancelled && "line-through"
                      )}>
                        {(lesson.pupil as any)?.name || "Unknown Pupil"}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {lesson.pickup_location && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {lesson.pickup_location}
                          </span>
                        )}
                        {lesson.duration_minutes && (
                          <span>{lesson.duration_minutes}min</span>
                        )}
                      </div>
                    </div>

                    {/* Price + status badge */}
                    <div className="shrink-0 text-right">
                      {lesson.price && !isCancelled && (
                        <p className="text-sm font-semibold text-foreground">£{lesson.price}</p>
                      )}
                      {isNext && (
                        <Badge variant="default" className="text-[9px] h-4 px-1.5">NEXT</Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1.5">CANCELLED</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Overdue balances strip */}
        {overdueBalances.length > 0 && (
          <div className="border-t bg-destructive/5 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/70 mb-1.5 flex items-center gap-1">
              <PoundSterling className="h-3 w-3" />
              Outstanding Balances
            </p>
            <div className="flex flex-wrap gap-2">
              {overdueBalances.map((d) => (
                <span key={d.name} className="text-xs text-destructive font-medium">
                  {d.name}: £{d.balance.toFixed(0)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer link */}
        <Link
          to="/instructor/schedule"
          className="flex items-center justify-between px-4 py-2.5 border-t text-xs text-primary hover:bg-muted/30 transition-colors font-medium"
        >
          View Full Schedule
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
