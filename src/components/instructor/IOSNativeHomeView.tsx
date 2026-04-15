import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, ChevronRight, Clock, Hourglass,
  PoundSterling, Navigation, Phone, MessageSquare, Send, Play, MapPin,
  Calendar, Users, Briefcase, BookOpen, Fuel, BarChart3, Settings,
  PlusCircle, CheckCircle, MessageCircle, AlertTriangle,
} from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { useTheme } from "@/context/ThemeContext";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { usePupilUnreadCount } from "@/hooks/usePupilUnreadCount";
import { useRunningLateDetection } from "@/hooks/useRunningLateDetection";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { triggerHaptic } from "@/lib/haptics";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IOSNativeHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Next Lesson Card (all hooks at top level) ───
function IOSNextLessonCard({ instructorId }: { instructorId: string | undefined }) {
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const [expanded, setExpanded] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Always call hooks — pass null-safe values
  const pickupPostcode = nextLesson?.pickupPostcode ?? null;
  const { durationMinutes: etaMinutes, durationText: etaText, trafficCondition } = useTrafficETA(pickupPostcode);
  const { data: pupilUnreadCount = 0 } = usePupilUnreadCount(instructorId, nextLesson?.pupilId);
  const { isRunningLate, lateByMinutes, suggestedMessage, arrivalTimeText, sendLateETA } = useRunningLateDetection({
    etaMinutes,
    minutesUntil: nextLesson?.minutesUntil ?? 999,
    pupilName: nextLesson?.pupilName ?? "",
    pupilPhone: nextLesson?.pupilPhone ?? null,
  });

  // No lesson — show "All Clear"
  if (!nextLesson) {
    return (
      <div className="mx-4 mb-4">
        <button
          className="w-full rounded-2xl p-5 flex items-center gap-4 bg-card"
          onClick={() => navigate("/instructor/diary")}
        >
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[17px] font-semibold text-foreground">All Clear!</p>
            <p className="text-[13px] text-muted-foreground">No upcoming lessons — tap to add one</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
        </button>
      </div>
    );
  }

  const isToday = nextLesson.minutesUntil < 1440;
  const dayLabel = isToday ? "Today" : "Tomorrow";
  const canStart = nextLesson.minutesUntil <= 15;
  const balance = nextLesson.accountBalance || 0;
  const balanceColor = balance >= 0 ? "#34C759" : "#FF9500";
  const dur = nextLesson.durationMinutes || 60;
  const durationLabel = dur >= 60 ? `${Math.floor(dur / 60)}h` : `${dur}m`;
  const countdownText = nextLesson.minutesUntil <= 0
    ? "Now"
    : nextLesson.minutesUntil < 60
    ? `in ${nextLesson.minutesUntil} min`
    : `in ${Math.floor(nextLesson.minutesUntil / 60)}h ${nextLesson.minutesUntil % 60}m`;
  const trafficDotColor = trafficCondition === "light" ? "#34C759" : trafficCondition === "moderate" ? "#FFCC00" : "#FF3B30";

  const handleSendDelay = (minutes: number) => {
    if (!nextLesson.pupilPhone) return;
    const firstName = nextLesson.pupilName.split(" ")[0];
    const msg = `Hi ${firstName}, I'm running about ${minutes} minutes late. Apologies for the inconvenience!`;
    const a = document.createElement("a");
    a.href = `sms:${nextLesson.pupilPhone}?body=${encodeURIComponent(msg)}`;
    a.click();
  };

  const handleCancelled = () => {
    queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] });
    queryClient.invalidateQueries({ queryKey: ["today-overview"] });
  };

  const startTimeObj = (() => {
    try {
      const [h, m] = nextLesson.startTime.split(":").map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      return d;
    } catch { return new Date(); }
  })();
  const endTimeObj = new Date(startTimeObj.getTime() + dur * 60000);
  const endTimeStr = format(endTimeObj, "HH:mm");

  return (
    <div className="mx-4 mb-4">
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgb(38,64,140) 0%, rgb(31,89,166) 50%, rgb(26,115,179) 100%)",
          boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
        }}
        layout
      >
        {/* Collapsed Content */}
        <button
          onClick={() => { setExpanded(!expanded); triggerHaptic("light"); }}
          className="w-full text-left p-4"
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-[50px] h-[50px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
                {nextLesson.pupilProfileImage ? (
                  <img src={nextLesson.pupilProfileImage} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[18px] font-bold text-white">{getInitials(nextLesson.pupilName)}</span>
                )}
              </div>
              {pupilUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pupilUnreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.5px]">NEXT UP</span>
                <span className="text-white/40">·</span>
                <span className="text-[12px] font-semibold" style={{ color: "#00FFFF" }}>{countdownText}</span>
              </div>
              <p className="text-[17px] font-bold text-white mt-0.5 truncate">{nextLesson.pupilName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[20px] font-bold text-white tabular-nums">{nextLesson.startTime}</p>
              <ExpandChevron isExpanded={expanded} className="text-white/50 ml-auto" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 overflow-x-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-[11px] whitespace-nowrap">
              <Calendar className="h-3 w-3" /> {dayLabel}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-[11px] whitespace-nowrap">
              <Clock className="h-3 w-3" /> {durationLabel}
            </span>
            {(nextLesson.pickupPostcode || nextLesson.pickupLocation) && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-[11px] whitespace-nowrap">
                <MapPin className="h-3 w-3" /> {nextLesson.pickupLocation || nextLesson.pickupPostcode}
              </span>
            )}
          </div>
        </button>

        {/* Running Late Alert */}
        {isRunningLate && (
          <div className="mx-4 mb-2 p-2.5 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "rgba(255,149,0,0.2)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#FFD60A" }} />
            <span className="text-[12px] flex-1" style={{ color: "#FFD6A0" }}>~{lateByMinutes} min late • ETA {arrivalTimeText}</span>
            <button onClick={sendLateETA} className="text-[11px] font-semibold underline shrink-0" style={{ color: "#FFD60A" }}>Send ETA</button>
          </div>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="h-px bg-white/10 mb-3" />

                {/* Info Badges */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white/[0.08] rounded-2xl py-3 px-2 text-center">
                    <Clock className="h-4 w-4 text-white/50 mx-auto mb-1" />
                    <p className="text-[10px] text-white/50">Start</p>
                    <p className="text-[14px] font-bold text-white tabular-nums">{nextLesson.startTime}</p>
                  </div>
                  <div className="bg-white/[0.08] rounded-2xl py-3 px-2 text-center">
                    <Hourglass className="h-4 w-4 text-white/50 mx-auto mb-1" />
                    <p className="text-[10px] text-white/50">Duration</p>
                    <p className="text-[14px] font-bold text-white">{durationLabel}</p>
                  </div>
                  <div className="bg-white/[0.08] rounded-2xl py-3 px-2 text-center">
                    <PoundSterling className="h-4 w-4 mx-auto mb-1" style={{ color: balanceColor }} />
                    <p className="text-[10px] text-white/50">Balance</p>
                    <p className="text-[14px] font-bold" style={{ color: balanceColor }}>£{Math.abs(balance)}</p>
                  </div>
                </div>

                {/* ETA Row */}
                {etaText && (
                  <div className="bg-white/[0.08] rounded-2xl p-3 flex items-center gap-3 mb-3">
                    <Car className="h-5 w-5 shrink-0" style={{ color: "#00FFFF" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/50">Live ETA</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-white">~{etaText}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: trafficDotColor }} />
                        <span className="text-[12px] text-white/70 capitalize">{trafficCondition || "unknown"} traffic</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unread Messages */}
                {pupilUnreadCount > 0 && (
                  <button
                    onClick={() => navigate("/instructor/messages")}
                    className="w-full bg-white/[0.08] rounded-2xl p-3 flex items-center gap-3 mb-3"
                  >
                    <MessageCircle className="h-5 w-5 shrink-0" style={{ color: "#FF9500" }} />
                    <span className="text-[13px] text-white/80 flex-1 text-left">
                      {pupilUnreadCount} unread message{pupilUnreadCount !== 1 ? "s" : ""} from {nextLesson.pupilName.split(" ")[0]}
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/30" />
                  </button>
                )}

                {/* Start Lesson Button */}
                {canStart && (
                  <button
                    onClick={() => navigate(`/instructor/track?lesson=${nextLesson.lessonId}`)}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white text-[15px] flex items-center justify-center gap-2 mb-3"
                    style={{ background: "linear-gradient(135deg, #34C759, #30B350)" }}
                  >
                    <Play className="h-4 w-4" /> Start Lesson
                  </button>
                )}

                {/* Primary Actions */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <button
                    onClick={() => {
                      const q = nextLesson.pickupPostcode || nextLesson.pickupLocation || "";
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`, "_blank");
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-white/[0.12] rounded-2xl py-3 min-h-[64px]"
                  >
                    <Navigation className="h-5 w-5" style={{ color: "#007AFF" }} />
                    <span className="text-[10px] text-white/70">Navigate</span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center justify-center gap-1 bg-white/[0.12] rounded-2xl py-3 min-h-[64px]">
                        <Send className="h-5 w-5" style={{ color: "#007AFF" }} />
                        <span className="text-[10px] text-white/70">On My Way</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                      {[5, 10, 15, 20, 30].map(min => (
                        <DropdownMenuItem key={min} onClick={() => handleSendDelay(min)}>
                          {min} min late
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { if (nextLesson.pupilPhone) window.open(`tel:${nextLesson.pupilPhone}`); }}>
                        Call ASAP
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={sendLateETA}>Send ETA</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={() => { if (nextLesson.pupilPhone) window.open(`tel:${nextLesson.pupilPhone}`); }}
                    className="flex flex-col items-center justify-center gap-1 bg-white/[0.12] rounded-2xl py-3 min-h-[64px]"
                  >
                    <Phone className="h-5 w-5" style={{ color: "#34C759" }} />
                    <span className="text-[10px] text-white/70">Call</span>
                  </button>

                  <button
                    onClick={() => {
                      if (nextLesson.pupilPhone) {
                        const a = document.createElement("a");
                        a.href = `sms:${nextLesson.pupilPhone}`;
                        a.click();
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-white/[0.12] rounded-2xl py-3 min-h-[64px]"
                  >
                    <MessageSquare className="h-5 w-5" style={{ color: "#FF9500" }} />
                    <span className="text-[10px] text-white/70">SMS</span>
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRescheduleOpen(true)}
                    className="py-2.5 rounded-2xl bg-white/[0.08] text-white/80 text-[13px] font-medium"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="py-2.5 rounded-2xl text-[13px] font-medium"
                    style={{ backgroundColor: "rgba(255,0,0,0.12)", color: "#FF3B30" }}
                  >
                    Cancel Lesson
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CancelLessonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        lessonId={nextLesson.lessonId}
        pupilId={nextLesson.pupilId}
        pupilName={nextLesson.pupilName}
        amountDue={nextLesson.accountBalance || 0}
        pupilBalance={nextLesson.accountBalance || 0}
        durationMinutes={nextLesson.durationMinutes || 60}
        lessonDate={nextLesson.lessonDate}
        lessonTime={nextLesson.startTime}
        endTime={endTimeStr}
        instructorId={instructorId || ""}
        onCancelled={handleCancelled}
      />
      <RescheduleLessonSheet
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        lessonId={nextLesson.lessonId}
        instructorId={instructorId || ""}
        pupilName={nextLesson.pupilName}
        currentDate={nextLesson.lessonDate}
        currentTime={nextLesson.startTime}
        durationMinutes={nextLesson.durationMinutes || 60}
        onRescheduled={handleCancelled}
      />
    </div>
  );
}

// ─── Feature Tile ───
function FeatureTile({
  icon: Icon, title, subtitle, color, badge, onClick,
}: {
  icon: React.ElementType; title: string; subtitle: string; color: string;
  badge?: number; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => { triggerHaptic("light"); onClick(); }}
      className="flex flex-col items-center gap-2 rounded-2xl p-4 relative bg-card"
    >
      {badge && badge > 0 ? (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <div
        className="w-[50px] h-[50px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}1F` }}
      >
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <span className="text-[13px] font-semibold text-foreground">{title}</span>
      <span className="text-[11px] text-muted-foreground -mt-1">{subtitle}</span>
    </motion.button>
  );
}

// ─── More Feature Mini Tile ───
function MoreTile({ icon: Icon, title, color, onClick }: {
  icon: React.ElementType; title: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => { triggerHaptic("light"); onClick(); }}
      className="flex flex-col items-center gap-2 rounded-2xl py-3.5 shrink-0 bg-card"
      style={{ width: 90 }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}1F` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <span className="text-[11px] font-medium text-foreground truncate w-full text-center px-1">{title}</span>
    </motion.button>
  );
}

// ─── Main Component ───
export function IOSNativeHomeView({ instructorId, instructor }: IOSNativeHomeViewProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || resolvedTheme === "oled";

  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const pendingJobsCount = usePendingJobsCount();
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);

  const now = new Date();
  const weeklyEarnings = weeklyGoals?.earningsThisWeek ?? 0;
  const upcomingBookings = (weeklyGoals?.lessonsScheduled ?? 0) + (weeklyGoals?.lessonsCompleted ?? 0);
  const diaryEntries = todayLessons?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── 1. HEADER ─── */}
      <div
        className="w-full"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgb(20,31,56) 0%, rgb(26,46,82) 100%)"
            : "linear-gradient(135deg, rgb(38,64,97) 0%, rgb(51,84,122) 100%)",
        }}
      >
        <div style={{ height: 54 }} />
        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <h1 className="text-[24px] font-bold text-white leading-tight">{instructor?.name || "Instructor"}</h1>
            <p className="text-[15px] text-white/80">Welcome</p>
          </div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <Car className="h-6 w-6 text-white/90" />
          </div>
        </div>

        <div className="mx-5 mb-5 rounded-2xl p-3.5" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.15)" }}>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Weekly</p>
              <p className="text-[22px] font-bold text-white mt-0.5 tabular-nums">£{weeklyEarnings}</p>
              <p className="text-[9px] text-white/60">Earnings this week</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Monthly</p>
              <p className="text-[22px] font-bold text-white mt-0.5 tabular-nums">£{Math.round(monthEarnings)}</p>
              <p className="text-[9px] text-white/60">Earnings this month</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Schedule</p>
              <p className="text-[22px] font-bold text-white mt-0.5 tabular-nums">{upcomingBookings}</p>
              <p className="text-[9px] text-white/60">Upcoming Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 pb-24 bg-[#F2F2F7] dark:bg-[#111111]">
        {/* ─── 2. DATE/TIME ROW ─── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-[15px] font-semibold text-primary">
            {format(now, "EEE, MMM d, yyyy")}
          </p>
          <p className="text-[15px] font-medium text-muted-foreground tabular-nums">
            {format(now, "HH:mm")}
          </p>
        </div>

        {/* ─── 3. NEXT LESSON TILE ─── */}
        <IOSNextLessonCard instructorId={instructorId} />

        {/* ─── 4. FEATURE TILES ─── */}
        <div className="px-4 mb-5">
          <div className="grid grid-cols-3 gap-3">
            <FeatureTile icon={Users} title="Pupils" subtitle={`${todayOverview?.lessonCount ?? 0} Active`} color="#5856D6" onClick={() => navigate("/instructor/pupils")} />
            <FeatureTile icon={Calendar} title="Bookings" subtitle={`${upcomingBookings} upcoming`} color="#007AFF" onClick={() => navigate("/instructor/diary")} />
            <FeatureTile icon={PoundSterling} title="Finances" subtitle={`£${weeklyEarnings}`} color="#34C759" onClick={() => navigate("/instructor/pay")} />
            <FeatureTile icon={MessageSquare} title="Messages" subtitle={`${unreadCount} unread`} color="#FF9500" badge={unreadCount} onClick={() => navigate("/instructor/messages")} />
            <FeatureTile icon={Briefcase} title="Job Offers" subtitle={`${pendingJobsCount} available`} color="#AF52DE" badge={pendingJobsCount} onClick={() => navigate("/instructor/jobs")} />
            <FeatureTile icon={BookOpen} title="Diary" subtitle={`${diaryEntries} entries`} color="#5AC8FA" onClick={() => navigate("/instructor/diary")} />
          </div>
        </div>

        <BottomPromoGroup className="mx-4 mb-2" />
        <UpcomingEventsCard className="mx-4 mb-4" />

        {/* ─── 5. MORE FEATURES ─── */}
        <div className="mb-6">
          <p className="text-[20px] font-bold text-foreground px-5 mb-3">More Features</p>
          <div className="flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
            <MoreTile icon={Fuel} title="Fuel Finder" color="#FF9500" onClick={() => navigate("/instructor/fuel")} />
            <MoreTile icon={MapPin} title="Live Tracking" color="#007AFF" onClick={() => navigate("/instructor/tracking")} />
            <MoreTile icon={BarChart3} title="Dashboard" color="#34C759" onClick={() => navigate("/instructor")} />
            <MoreTile icon={Settings} title="Settings" color="#8E8E93" onClick={() => navigate("/instructor/settings")} />
            <MoreTile icon={PlusCircle} title="Add Lesson" color="#00C7BE" onClick={() => navigate("/instructor/diary?action=add")} />
          </div>
        </div>
      </div>
    </div>
  );
}
