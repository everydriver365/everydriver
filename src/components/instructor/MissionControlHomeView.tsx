import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar, Users, PoundSterling, Clock, CheckCircle2, AlertTriangle,
  Zap, CreditCard, Plus, MessageSquare, MapPin, Eye, Settings, ChevronRight,
  Heart, Shield, Gauge, Navigation,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InsightTilesGrid } from "@/components/instructor/InsightTilesGrid";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";

interface MissionControlHomeViewProps {
  instructorId: string | undefined;
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
  } | null;
}

const getGreeting = (firstName: string) => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}`;
  return `Hello, ${firstName}`;
};

export function MissionControlHomeView({ instructorId, instructor }: MissionControlHomeViewProps) {
  const navigate = useNavigate();
  const { instructor: authInstructor } = useInstructorAuth();
  const { data: todayOverview } = useTodayOverview(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructorId);
  const { total: combinedNotifCount } = useCombinedNotificationCount(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: lastWeekComparison } = useLastWeekComparison(instructorId);
  const { data: gapSlots } = useRealGapSlots(instructorId);
  const { alerts } = useDrivingAlerts(instructorId);

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();
  const hoursThisWeek = weeklyGoals?.hoursThisWeek || 0;
  const monthEarnings = weeklyGoals?.earningsThisWeek || 0;
  const activePupils = lastWeekComparison?.lessonsThisWeek || 0;
  const gapCount = gapSlots?.length || 0;

  return (
    <div className="px-4 pb-6 space-y-3">
      {/* Top strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={instructor?.profile_image_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {instructor?.name ? getInitials(instructor.name) : "I"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold truncate block">{getGreeting(firstName)}</span>
          <span className="text-xs text-muted-foreground">Grade A Instructor</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {[
            { label: "Lessons", value: todayOverview?.lessonCount ?? 0, color: "bg-primary/10 text-primary" },
            { label: "Revenue", value: `£${monthEarnings >= 1000 ? `${(monthEarnings / 1000).toFixed(1)}k` : monthEarnings}`, color: "bg-emerald-500/10 text-emerald-600" },
            { label: "Hours", value: `${hoursThisWeek}h`, color: "bg-purple-500/10 text-purple-600" },
            { label: "Pupils", value: activePupils, color: "bg-amber-500/10 text-amber-600" },
          ].map((s) => (
            <div key={s.label} className={cn("px-2.5 py-1.5 rounded-lg text-center", s.color)}>
              <p className="text-sm font-bold leading-tight">{s.value}</p>
              <p className="text-[9px] opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-2.5 py-1.5 shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-600">LIVE</span>
        </div>
      </motion.div>

      {/* 4-pane grid */}
      <div className="grid grid-cols-4 gap-3" style={{ minHeight: "380px" }}>
        {/* Schedule — 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="col-span-2 bg-card border border-border rounded-xl overflow-hidden flex flex-col"
        >
          <div className="py-2 px-4 bg-muted/30 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </span>
            <button onClick={() => navigate("/instructor/schedule")} className="text-[10px] text-primary font-medium">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {(todayLessons || []).length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
                No lessons today
              </div>
            ) : (
              (todayLessons || []).map((l, i) => {
                const isCurrent = nextLesson?.pupilName === l.pupilName;
                const isDone = l.status === "completed";
                return (
                  <div key={l.id} className={cn(
                    "flex items-center gap-3 px-4 py-2.5 border-b border-border/50 text-sm",
                    isCurrent && "bg-primary/5",
                    isDone && "opacity-50"
                  )}>
                    <span className="font-mono text-xs text-muted-foreground w-10">
                      {l.startTime?.slice(0, 5)}
                    </span>
                    <span className={cn("font-medium flex-1 truncate", isDone && "line-through")}>
                      {l.pupilName}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0">{l.lessonType}</Badge>
                    {isCurrent && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Alerts pane */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
        >
          <div className="py-2 px-4 bg-amber-500/5 border-b border-border">
            <span className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> Alerts
            </span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-2">
            {unreadCount > 0 && (
              <button
                onClick={() => navigate("/instructor/messages")}
                className="w-full text-left text-xs p-2.5 rounded-lg border border-primary/20 bg-primary/5"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
                </div>
              </button>
            )}
            {(alerts || []).slice(0, 3).map((a, i) => (
              <div key={i} className="text-xs p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {a.title}
                </div>
              </div>
            ))}
            {gapCount > 0 && (
              <button
                onClick={() => navigate("/instructor/gaps")}
                className="w-full text-left text-xs p-2.5 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  {gapCount} open gap{gapCount !== 1 ? "s" : ""} this week
                </div>
              </button>
            )}
            {!unreadCount && !(alerts || []).length && !gapCount && (
              <p className="text-xs text-muted-foreground text-center py-4">All clear 🎉</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions pane */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
        >
          <div className="py-2 px-4 bg-primary/5 border-b border-border">
            <span className="text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wide text-primary">
              <Zap className="h-3.5 w-3.5" /> Actions
            </span>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: CreditCard, label: "Payment", color: "text-emerald-600", route: "/instructor/pay" },
                { icon: Plus, label: "Book", color: "text-primary", route: "/instructor/schedule?action=add" },
                { icon: MessageSquare, label: "Messages", color: "text-blue-600", route: "/instructor/messages", badge: unreadCount },
                { icon: MapPin, label: "Navigate", color: "text-red-600", route: "/instructor/find-my-car" },
                { icon: Heart, label: "Health", color: "text-pink-600", route: "/instructor/health" },
                { icon: Settings, label: "Settings", color: "text-muted-foreground", route: "/instructor/settings" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.route)}
                  className="relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <a.icon className={cn("h-5 w-5", a.color)} />
                  <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
                  {a.badge ? (
                    <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                      <span className="text-[9px] text-destructive-foreground font-bold">{a.badge}</span>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Next lesson highlight (if available) */}
      {nextLesson && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden"
        >
          <div className="flex">
            <div className="w-1.5 bg-primary" />
            <div className="p-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {nextLesson.pupilName ? getInitials(nextLesson.pupilName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wide">
                      Next Up · {nextLesson.startTime?.slice(0, 5)}
                    </p>
                    <p className="font-semibold text-sm">{nextLesson.pupilName}</p>
                    {nextLesson.pickupLocation && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {nextLesson.pickupLocation}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => navigate(`/instructor/pupils/${nextLesson.pupilId}`)}
                >
                  <Navigation className="h-3.5 w-3.5 mr-1" /> View
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Insight tiles */}
      <InsightTilesGrid gapCount={gapCount} />

      {/* Bottom promos */}
      <BottomPromoGroup />
    </div>
  );
}
