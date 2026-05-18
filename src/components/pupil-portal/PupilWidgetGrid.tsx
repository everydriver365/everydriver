import { motion } from "framer-motion";
import { Car, Clock, CreditCard, TrendingUp, BookOpen, Target, Calendar, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePupilBookedCourse } from "@/hooks/usePupilBookedCourse";

interface WidgetProps {
  pupilId: string;
  pupil: {
    lessons_completed: number | null;
    progress: number | null;
    account_balance: number | null;
    prepaid_hours: number | null;
  };
  brandColour?: string | null;
  onNavigate?: (section: string) => void;
}

interface Widget {
  id: string;
  icon: React.ElementType;
  label: string;
  getValue: () => string;
  subtext?: string;
  gradient: string;
  iconColor: string;
  section?: string;
  isNegative?: boolean;
}

export function PupilWidgetGrid({ pupilId, pupil, brandColour, onNavigate }: WidgetProps) {
  const balance = pupil.account_balance || 0;
  const hours = Math.round((pupil.lessons_completed || 0) * 1.5);
  const progress = pupil.progress || 0;
  const lessonsCompleted = pupil.lessons_completed || 0;

  const { data: bookedCourse } = usePupilBookedCourse(pupilId);
  const courseTotal = bookedCourse?.totalLessons ?? 0;
  const lessonsOfCourseTaken = bookedCourse ? Math.min(lessonsCompleted, courseTotal) : 0;
  const ringProgress = bookedCourse && courseTotal > 0
    ? Math.min((lessonsOfCourseTaken / courseTotal) * 100, 100)
    : 0;

  const widgets: Widget[] = [
    {
      id: "lessons",
      icon: Car,
      label: "Lessons",
      getValue: () => `${pupil.lessons_completed || 0}`,
      subtext: "completed",
      gradient: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-500",
      section: "schedule",
    },
    {
      id: "hours",
      icon: Clock,
      label: "Hours",
      getValue: () => `${hours}h`,
      subtext: "on the road",
      gradient: "from-violet-500/10 to-violet-600/5",
      iconColor: "text-violet-500",
      section: "history",
    },
    {
      id: "progress",
      icon: TrendingUp,
      label: "Progress",
      getValue: () => `${progress}%`,
      subtext: "course done",
      gradient: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-500",
      section: "progress",
    },
    {
      id: "balance",
      icon: CreditCard,
      label: "Balance",
      getValue: () => `£${Math.abs(balance).toFixed(0)}`,
      subtext: balance < 0 ? "owed" : "credit",
      gradient: balance < 0 ? "from-amber-500/10 to-amber-600/5" : "from-emerald-500/10 to-emerald-600/5",
      iconColor: balance < 0 ? "text-amber-500" : "text-emerald-500",
      section: "payments",
      isNegative: balance < 0,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Activity Ring + Widget Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Activity Ring Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-2 bg-card rounded-2xl border border-border shadow-sm p-4"
        >
          <div className="flex items-center gap-4">
            {/* Ring */}
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={brandColour || "hsl(var(--primary))"}
                  strokeWidth="3"
                  strokeDasharray={`${ringProgress} ${100 - ringProgress}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="h-5 w-5" style={{ color: brandColour || "hsl(var(--primary))" }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Test Readiness</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {bookedCourse && courseTotal > 0
                  ? `${lessonsOfCourseTaken} of ${courseTotal} course lessons taken`
                  : `${lessonsCompleted} ${lessonsCompleted === 1 ? "lesson" : "lessons"} taken`}
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: brandColour || "hsl(var(--primary))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${ringProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stat Widgets */}
        {widgets.map((widget, i) => (
          <motion.button
            key={widget.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            onClick={() => widget.section && onNavigate?.(widget.section)}
            className={cn(
              "bg-gradient-to-br rounded-2xl p-3.5 text-left border border-border shadow-sm",
              "hover:shadow-md transition-shadow",
              widget.gradient
            )}
          >
            <widget.icon className={cn("h-5 w-5 mb-2", widget.iconColor)} />
            <div className={cn("text-2xl font-bold text-foreground", widget.isNegative && "text-amber-600 dark:text-amber-400")}>
              {widget.isNegative && "-"}{widget.getValue()}
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">{widget.subtext}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
