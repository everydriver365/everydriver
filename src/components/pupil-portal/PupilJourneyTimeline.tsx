import { motion } from "framer-motion";
import { Check, Circle, BookOpen, Car, Award, Flag, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  icon: React.ElementType;
  label: string;
  detail?: string;
  completed: boolean;
  current?: boolean;
}

interface PupilJourneyTimelineProps {
  lessonsCompleted: number;
  progress: number;
  hasTestDate: boolean;
  brandColour?: string | null;
}

export function PupilJourneyTimeline({ lessonsCompleted, progress, hasTestDate, brandColour }: PupilJourneyTimelineProps) {
  const milestones: Milestone[] = [
    {
      id: "first-lesson",
      icon: Car,
      label: "First Lesson",
      detail: "Started learning",
      completed: lessonsCompleted >= 1,
    },
    {
      id: "theory",
      icon: BookOpen,
      label: "Theory Practice",
      detail: "Study & mock tests",
      completed: lessonsCompleted >= 5,
      current: lessonsCompleted >= 1 && lessonsCompleted < 5,
    },
    {
      id: "10-lessons",
      icon: Award,
      label: "10 Lessons",
      detail: "Building confidence",
      completed: lessonsCompleted >= 10,
      current: lessonsCompleted >= 5 && lessonsCompleted < 10,
    },
    {
      id: "test-ready",
      icon: Flag,
      label: "Test Ready",
      detail: progress >= 80 ? "Ready!" : `${progress}% progress`,
      completed: progress >= 80,
      current: lessonsCompleted >= 10 && progress < 80,
    },
    {
      id: "test-day",
      icon: GraduationCap,
      label: "Test Day",
      detail: hasTestDate ? "Booked" : "Coming soon",
      completed: false,
      current: progress >= 80,
    },
  ];

  const color = brandColour || "hsl(var(--primary))";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Your Journey</h3>
      <div className="relative">
        {milestones.map((milestone, i) => {
          const isLast = i === milestones.length - 1;

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-3 relative"
            >
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[13px] top-7 w-0.5 h-[calc(100%-4px)]">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundColor: milestone.completed ? color : "hsl(var(--muted))",
                      opacity: milestone.completed ? 0.4 : 1,
                    }}
                  />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors",
                  milestone.completed
                    ? "text-white"
                    : milestone.current
                    ? "border-2 bg-background"
                    : "bg-muted text-muted-foreground"
                )}
                style={{
                  backgroundColor: milestone.completed ? color : undefined,
                  borderColor: milestone.current ? color : undefined,
                  color: milestone.current ? color : undefined,
                }}
              >
                {milestone.completed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <milestone.icon className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-5 flex-1", isLast && "pb-0")}>
                <div className={cn(
                  "text-sm font-medium",
                  milestone.completed || milestone.current ? "text-foreground" : "text-muted-foreground"
                )}>
                  {milestone.label}
                </div>
                {milestone.detail && (
                  <div className="text-[11px] text-muted-foreground">{milestone.detail}</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
