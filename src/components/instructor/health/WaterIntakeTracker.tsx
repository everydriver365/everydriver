import { Droplets, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstructorHealth } from "@/hooks/useInstructorHealth";
import { cn } from "@/lib/utils";

export function WaterIntakeTracker() {
  const { todayWaterLog, addWater, removeWater, isAddingWater, isRemovingWater, waterGoal } = useInstructorHealth();
  const currentCount = todayWaterLog?.glasses_count || 0;
  const progress = Math.min((currentCount / waterGoal) * 100, 100);
  const isGoalReached = currentCount >= waterGoal;

  // Calculate circumference for progress ring
  const radius = 42;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const gradientColors = isGoalReached
    ? { start: "#10b981", end: "#06b6d4" }
    : { start: "#0ea5e9", end: "#8b5cf6" };
  const glowColor = isGoalReached ? "rgba(16,185,129,0.4)" : "rgba(14,165,233,0.4)";

  const tipAngle = (progress / 100) * 2 * Math.PI - Math.PI / 2;
  const tipX = 56 + radius * Math.cos(tipAngle);
  const tipY = 56 + radius * Math.sin(tipAngle);

  return (
    <Card className="border-sky-200/50 dark:border-sky-900/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-28 h-28 transform -rotate-90">
              <defs>
                <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gradientColors.start} />
                  <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-sky-100/10 dark:text-sky-900/10"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="url(#waterGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
              />
              {progress > 2 && (
                <circle cx={tipX} cy={tipY} r={strokeWidth / 2 + 1} fill={gradientColors.end} opacity="0.5" style={{ filter: "blur(2px)" }} />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{currentCount}</span>
              <span className="text-xs text-muted-foreground">/ {waterGoal}</span>
            </div>
          </div>

          {/* Glass icons and quick add */}
          <div className="flex-1">
            {/* Glass indicators */}
            <div className="flex flex-wrap gap-1 mb-3">
              {Array.from({ length: waterGoal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-6 h-8 rounded-2xl border-2 transition-all duration-300",
                    i < currentCount
                      ? "bg-sky-400 dark:bg-sky-500 border-sky-500 dark:border-sky-400"
                      : "bg-muted/30 border-muted-foreground/20"
                  )}
                  style={{
                    clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)",
                  }}
                />
              ))}
            </div>

            {/* Quick add/remove buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeWater(1)}
                disabled={isRemovingWater || currentCount === 0}
                className="border-sky-200 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-900/30"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addWater(1)}
                disabled={isAddingWater}
                className="flex-1 border-sky-200 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-900/30"
              >
                <Plus className="h-4 w-4 mr-1" />1
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addWater(2)}
                disabled={isAddingWater}
                className="flex-1 border-sky-200 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-900/30"
              >
                <Plus className="h-4 w-4 mr-1" />2
              </Button>
            </div>

            {/* Encouragement text */}
            {isGoalReached ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                🎉 Goal reached! Great job staying hydrated!
              </p>
            ) : currentCount > 0 ? (
              <p className="text-xs text-muted-foreground mt-2">
                {waterGoal - currentCount} more to reach your goal
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Tap + to log your water intake
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
