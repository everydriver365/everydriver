import { useState, useEffect } from "react";
import { Clock, Calendar, PoundSterling, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, differenceInMinutes } from "date-fns";

interface TodayAtAGlanceProps {
  instructorId: string | undefined;
}

interface TodayData {
  nextLesson: { pupilName: string; time: string; minutesUntil: number } | null;
  lessonsRemaining: number;
  hoursToday: number;
  earningsToday: number;
  loading: boolean;
}

export function TodayAtAGlance({ instructorId }: TodayAtAGlanceProps) {
  const [data, setData] = useState<TodayData>({
    nextLesson: null,
    lessonsRemaining: 0,
    hoursToday: 0,
    earningsToday: 0,
    loading: true,
  });

  useEffect(() => {
    if (!instructorId) return;

    const fetchToday = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();

      try {
        // Fetch today's lessons with pupil info
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes, status, pupils(name)")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        const todayLessons = lessons || [];
        const totalMinutes = todayLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

        // Find next upcoming lesson
        let nextLesson: TodayData["nextLesson"] = null;
        for (const lesson of todayLessons) {
          if (lesson.start_time && lesson.status !== "completed") {
            const [h, m] = lesson.start_time.split(":").map(Number);
            const lessonTime = new Date(now);
            lessonTime.setHours(h, m, 0, 0);
            if (lessonTime > now) {
              const pupilName = (lesson.pupils as any)?.name || "Pupil";
              nextLesson = {
                pupilName,
                time: lesson.start_time.slice(0, 5),
                minutesUntil: differenceInMinutes(lessonTime, now),
              };
              break;
            }
          }
        }

        // Remaining lessons (not completed)
        const remaining = todayLessons.filter(l => l.status !== "completed").length;

        // Today's earnings
        const { data: payments } = await supabase
          .from("payment_history")
          .select("amount")
          .eq("instructor_id", instructorId)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`);

        const earnings = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

        setData({
          nextLesson,
          lessonsRemaining: remaining,
          hoursToday: Math.round(totalMinutes / 60 * 10) / 10,
          earningsToday: earnings,
          loading: false,
        });
      } catch (err) {
        console.error("TodayAtAGlance error:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchToday();
  }, [instructorId]);

  if (data.loading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/[0.02] border-primary/20">
        <CardContent className="p-4">
          <div className="h-16 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const stats = [
    {
      icon: Clock,
      label: "Next Lesson",
      value: data.nextLesson
        ? `${data.nextLesson.time}`
        : "None",
      sub: data.nextLesson
        ? `${data.nextLesson.pupilName} · in ${formatMinutes(data.nextLesson.minutesUntil)}`
        : "No more lessons today",
    },
    {
      icon: Calendar,
      label: "Remaining",
      value: `${data.lessonsRemaining}`,
      sub: `lesson${data.lessonsRemaining !== 1 ? "s" : ""} left`,
    },
    {
      icon: Timer,
      label: "Hours",
      value: `${data.hoursToday}h`,
      sub: "scheduled today",
    },
    {
      icon: PoundSterling,
      label: "Earnings",
      value: `£${data.earningsToday.toFixed(0)}`,
      sub: "received today",
    },
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/[0.02] border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Today at a Glance</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground truncate">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
