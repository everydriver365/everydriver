import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  PoundSterling,
  AlertCircle,
  MapPin,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Map,
  Menu,
} from "lucide-react";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useUpcomingTests } from "@/hooks/useUpcomingTests";
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
    <div className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-4 space-y-3">
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

/* ── Lesson type badge config ── */
const lessonTypeBadges: Record<string, { label: string; bg: string; text: string }> = {
  standard: { label: "Standard", bg: "bg-blue-100", text: "text-blue-700" },
  test_prep: { label: "Test Prep", bg: "bg-amber-100", text: "text-amber-700" },
  mock_test: { label: "Mock Test", bg: "bg-purple-100", text: "text-purple-700" },
  motorway: { label: "Motorway", bg: "bg-green-100", text: "text-green-700" },
  refresher: { label: "Refresher", bg: "bg-pink-100", text: "text-pink-700" },
};

function getLessonTypeBadge(type: string) {
  return lessonTypeBadges[type] || lessonTypeBadges.standard;
}

/* ── Left border colour per lesson ── */
function getLessonBorderColor(type: string) {
  const map: Record<string, string> = {
    standard: "border-l-blue-400",
    test_prep: "border-l-amber-400",
    mock_test: "border-l-purple-400",
    motorway: "border-l-green-400",
    refresher: "border-l-pink-400",
  };
  return map[type] || "border-l-blue-400";
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

  // Data hooks
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: paymentSummary } = useInstructorPupilsPaymentSummary(instructorId);
  const { data: upcomingTests } = useUpcomingTests(instructorId);

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
  const tests = upcomingTests || [];

  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)] pb-24">
      {/* ── Greeting ── */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-[28px] font-bold text-foreground leading-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-muted-foreground text-base mt-0.5">{dateStr}</p>
      </div>

      {/* ── Stats grid ── */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="h-5 w-5 text-[hsl(192,70%,35%)]" />}
          iconBg="bg-[hsl(192,70%,35%)]/10"
          value={String(todayOverview?.lessonCount || 0)}
          label="Today's Lessons"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-[hsl(218,54%,40%)]" />}
          iconBg="bg-[hsl(218,54%,40%)]/10"
          value={String(activePupilCount || 0)}
          label="Active Pupils"
        />
        <StatCard
          icon={<PoundSterling className="h-5 w-5 text-[hsl(160,59%,40%)]" />}
          iconBg="bg-[hsl(160,59%,40%)]/10"
          value={`£${monthEarnings?.toFixed(2) || "0.00"}`}
          label="This Month"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-[hsl(40,90%,47%)]" />}
          iconBg="bg-[hsl(40,90%,47%)]/10"
          value={`£${paymentSummary?.totalDebt?.toFixed(2) || "0.00"}`}
          label="Outstanding"
        />
      </div>

      {/* ── Today's Schedule ── */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Today's Schedule</h2>
          <button
            onClick={() => navigate("/instructor/diary")}
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            See all <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {lessons.length === 0 && (
            <div className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-6 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No lessons scheduled today</p>
            </div>
          )}
          {lessons.map((lesson, i) => {
            const badge = getLessonTypeBadge(lesson.lessonType);
            const borderColor = getLessonBorderColor(lesson.lessonType);
            const endMinutes =
              (parseInt(lesson.startTime.substring(11, 13)) * 60 +
                parseInt(lesson.startTime.substring(14, 16))) +
              (lesson.durationMinutes || 60);
            const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
            const endM = String(endMinutes % 60).padStart(2, "0");
            const startDisplay = lesson.startTime.substring(11, 16);
            const isPaid = lesson.paymentStatus === "paid";

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/instructor/pupils/${lesson.id}`)}
                className={`bg-card rounded-[14px] border border-[hsl(214,20%,91%)] border-l-4 ${borderColor} p-4 cursor-pointer active:scale-[0.98] transition-transform`}
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
                    <span>{startDisplay} – {endH}:{endM}</span>
                  </div>
                  {lesson.pickupPostcode && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{lesson.pickupPostcode}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PoundSterling className="h-3.5 w-3.5" />
                      <span>£{lesson.amountDue?.toFixed(2) || "35.00"}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {isPaid ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {isPaid ? "Paid" : "Due"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Upcoming Tests ── */}
      {tests.length > 0 && (
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Upcoming Tests</h2>
            <button
              onClick={() => navigate("/instructor/menu")}
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {tests.map((test, i) => {
              const date = parseISO(test.testDate);
              const monthLabel = format(date, "MMM").toUpperCase();
              const dayLabel = format(date, "dd");

              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-[14px] border border-[hsl(214,20%,91%)] p-4 flex gap-4"
                >
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl w-14 h-14 flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary uppercase leading-none">{monthLabel}</span>
                    <span className="text-xl font-bold text-primary leading-none mt-0.5">{dayLabel}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base truncate">{test.pupilName}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {test.testTime ? test.testTime.substring(0, 5) : "TBC"} — {test.testCentreName || "Centre TBC"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-muted-foreground capitalize">{test.testType}</span>
                      {test.isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                          <AlertCircle className="h-3 w-3" />
                          {test.daysUntil} days
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom Quick Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-[hsl(214,20%,91%)] px-4 py-2 flex justify-around z-50">
        {[
          { icon: Clock, label: "Today", path: "/instructor", active: true },
          { icon: Users, label: "Pupils", path: "/instructor/pupils", active: false },
          { icon: Calendar, label: "Schedule", path: "/instructor/diary", active: false },
          { icon: Map, label: "Live Map", path: "/instructor/live", active: false },
          { icon: Menu, label: "More", path: "/instructor/menu", active: false },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 ${
              item.active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
