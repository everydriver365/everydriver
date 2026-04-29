import { Coffee, Clock, Dumbbell, Wind, Eye, Footprints, GlassWater, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBreakReminders } from "@/hooks/useBreakReminders";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorNotificationSettings } from "@/hooks/useInstructorNotificationSettings";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  stretch: Dumbbell,
  hydration: GlassWater,
  eyes: Eye,
  walk: Footprints,
  breathing: Wind,
};

interface BreakReminderWidgetProps {
  variant?: "compact" | "full";
}

export function BreakReminderWidget({ variant = "full" }: BreakReminderWidgetProps) {
  const navigate = useNavigate();
  const {
    nextBreak,
    currentBreak,
    minutesUntilNextBreak,
    formatBreakTime,
    getBreakDescription,
    hasBreaksAvailable,
    isLoading,
  } = useBreakReminders();

  // Show current break if we're in one
  const activeBreak = currentBreak || nextBreak;

  if (isLoading) {
    return (
      <Card className="border-emerald-200/50 dark:border-emerald-900/30">
        <CardContent className="p-4">
          <div className="h-16 bg-muted/30 rounded-2xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!hasBreaksAvailable || !activeBreak) {
    if (variant === "compact") return null;

    return (
      <Card className="border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Coffee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-sm">No breaks scheduled</p>
              <p className="text-xs text-muted-foreground">
                Your schedule is fully booked today
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = categoryIcons[activeBreak.suggestion.category] || Coffee;
  const isNow = !!currentBreak;

  if (variant === "compact") {
    return (
      <button
        onClick={() => navigate("/instructor/health")}
        className="w-full text-left"
      >
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-2xl transition-colors",
            isNow
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-muted/50 hover:bg-muted"
          )}
        >
          <div
            className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center",
              isNow
                ? "bg-emerald-500 text-white"
                : "bg-emerald-100 dark:bg-emerald-900/30"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isNow ? "text-white" : "text-emerald-600 dark:text-emerald-400"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isNow && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              <p className="font-medium text-sm truncate">
                {isNow ? "Break time!" : activeBreak.suggestion.title}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNow
                ? getBreakDescription(activeBreak)
                : `In ${minutesUntilNextBreak} min`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isNow
          ? "border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
          : "border-emerald-200/50 dark:border-emerald-900/30"
      )}
    >
      <CardContent className="p-0">
        <div
          className={cn(
            "p-4",
            isNow &&
              "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                isNow
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-100 dark:bg-emerald-900/30"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isNow ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isNow && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isNow
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground"
                  )}
                >
                  {isNow ? "Break Time!" : "Next Break"}
                </span>
              </div>
              <h3 className="font-semibold">{activeBreak.suggestion.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeBreak.suggestion.description}
              </p>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatBreakTime(activeBreak.startTime)} -{" "}
                  {formatBreakTime(activeBreak.endTime)}
                </span>
                <span>{getBreakDescription(activeBreak)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
