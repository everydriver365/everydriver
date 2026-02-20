import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  PoundSterling,
  AlertCircle,
  MapPin,
  ChevronRight,
  Settings,
} from "lucide-react";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ── Stat card ── */
function StatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

/* ── Lesson type badge colours ── */
function getLessonTypeBadge(lesson: TodayLesson) {
  // Infer type from duration or status
  const duration = lesson.durationMinutes || 60;
  if (duration >= 120) return { label: "Test Prep", bg: "bg-amber-50", text: "text-amber-600" };
  return { label: "Standard", bg: "bg-emerald-50", text: "text-emerald-600" };
}

/* ── Left border colour per lesson ── */
function getLessonBorderColor(index: number) {
  const colours = ["border-l-amber-400", "border-l-emerald-400", "border-l-blue-400", "border-l-violet-400", "border-l-pink-400"];
  return colours[index % colours.length];
}

/* ── Props ── */
export interface CleanHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
  todayOverview: { lessonCount: number; expectedEarnings: number } | null | undefined;
  todayLessons: TodayLesson[] | undefined;
}

export function CleanHomeView({
  instructorId,
  instructor,
  todayOverview,
  todayLessons,
}: CleanHomeViewProps) {
  const navigate = useNavigate();
  const now = new Date();
  const dateStr = format(now, "EEEE d MMMM");

  // Greeting
  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const hour = now.getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good Morning"
      : hour >= 12 && hour < 17
      ? "Good Afternoon"
      : hour >= 17 && hour < 21
      ? "Good Evening"
      : "Hello";

  // Extra data
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: paymentSummary } = useInstructorPupilsPaymentSummary(instructorId);

  // Active pupils count
  const { data: activePupilCount } = useQuery({
    queryKey: ["active-pupil-count", instructorId],
    queryFn: async () => {
      if (!instructorId) return 0;
      const { count, error } = await (supabase.from("pupils") as any)
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("is_active", true);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  const lessons = todayLessons || [];

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      {/* ── Greeting ── */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[28px] font-bold text-foreground leading-tight">{greeting}</h1>
        <p className="text-muted-foreground text-base mt-0.5">{dateStr}</p>
      </div>

      {/* ── Stats grid ── */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
          value={String(todayOverview?.lessonCount || 0)}
          label="Today's Lessons"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-teal-600" />}
          iconBg="bg-teal-500/10"
          value={String(activePupilCount || 0)}
          label="Active Pupils"
        />
        <StatCard
          icon={<PoundSterling className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-500/10"
          value={`£${monthEarnings?.toFixed(2) || "0.00"}`}
          label="This Month"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-500/10"
          value={`£${paymentSummary?.totalDebt?.toFixed(2) || "0.00"}`}
          label="Outstanding"
        />
      </div>

      {/* ── Quick Access ── */}
      <div className="px-5 mt-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Users, label: "Pupils", sub: String(activePupilCount || 0), color: "text-primary", bg: "bg-primary/10", path: "/instructor/pupils" },
            { icon: Clock, label: "Schedule", sub: `${todayOverview?.lessonCount || 0} today`, color: "text-amber-500", bg: "bg-amber-500/10", path: "/instructor/diary" },
            { icon: MapPin, label: "Live Map", sub: "Track", color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/instructor/live-map" },
            { icon: PoundSterling, label: "Payments", sub: `£${paymentSummary?.totalDebt?.toFixed(2) || "0.00"} due`, color: "text-blue-500", bg: "bg-blue-500/10", path: "/instructor/pupils" },
            { icon: AlertCircle, label: "Tests", sub: "Upcoming", color: "text-amber-500", bg: "bg-amber-500/10", path: "/instructor/tests" },
            { icon: Settings, label: "Settings", sub: "Admin", color: "text-muted-foreground", bg: "bg-muted/60", path: "/instructor/settings" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="bg-card rounded-2xl p-3.5 text-center flex flex-col items-center gap-1.5 active:scale-[0.95] active:bg-muted/50 transition-all shadow-sm"
            >
              <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} strokeWidth={1.8} />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight mt-0.5">{item.label}</p>
              <p className="text-[10px] text-muted-foreground leading-none">{item.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Schedule ── */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Today's Schedule</h2>
          <button
            onClick={() => navigate("/instructor/diary")}
            className="text-sm text-primary font-medium"
          >
            See all
          </button>
        </div>

        <div className="space-y-3">
          {lessons.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-muted-foreground text-sm">No lessons scheduled today</p>
            </div>
          )}
          {lessons.map((lesson, i) => {
            const badge = getLessonTypeBadge(lesson);
            const borderColor = getLessonBorderColor(i);
            const endMinutes =
              (parseInt(lesson.startTime.substring(11, 13)) * 60 +
                parseInt(lesson.startTime.substring(14, 16))) +
              (lesson.durationMinutes || 60);
            const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
            const endM = String(endMinutes % 60).padStart(2, "0");
            const startDisplay = lesson.startTime.substring(11, 16);

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/instructor/pupils/${lesson.id}`)}
                className={`bg-card rounded-2xl border border-border border-l-4 ${borderColor} p-4 cursor-pointer active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-foreground text-base">{lesson.pupilName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{startDisplay} - {endH}:{endM}</span>
                  </div>
                  {lesson.pickupPostcode && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{lesson.pickupPostcode}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PoundSterling className="h-3.5 w-3.5" />
                    <span>£{todayOverview?.expectedEarnings ? Math.round(todayOverview.expectedEarnings / Math.max(todayOverview.lessonCount, 1)) : 35}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
