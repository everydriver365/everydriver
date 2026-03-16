import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HoursTrackerProps {
  hoursCompleted: number;
  estimatedTotal: number;
  brandColour: string | null;
}

const MILESTONES = [10, 20, 30, 40];

export function HoursTracker({ hoursCompleted, estimatedTotal, brandColour }: HoursTrackerProps) {
  const accent = brandColour || "hsl(var(--primary))";
  const total = Math.max(estimatedTotal, 40);
  const percent = Math.min(100, (hoursCompleted / total) * 100);

  return (
    <Card style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: accent }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--brand-foreground)" }}>
              Hours Completed
            </h3>
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--brand-muted)" }}>
            {hoursCompleted}h / {total}h
          </span>
        </div>

        {/* Progress bar with milestones */}
        <div className="relative">
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${accent}15` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${percent}%`, backgroundColor: accent }}
            />
          </div>

          {/* Milestone markers */}
          <div className="relative mt-1">
            {MILESTONES.filter(m => m <= total).map((milestone) => {
              const pos = (milestone / total) * 100;
              const reached = hoursCompleted >= milestone;
              return (
                <div
                  key={milestone}
                  className="absolute -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${pos}%` }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: reached ? accent : "var(--brand-muted)", opacity: reached ? 1 : 0.3 }}
                  />
                  <span
                    className="text-[9px] mt-0.5"
                    style={{ color: reached ? accent : "var(--brand-muted)", opacity: reached ? 1 : 0.5 }}
                  >
                    {milestone}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
