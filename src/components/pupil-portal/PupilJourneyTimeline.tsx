import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, UserPlus, BookOpen, GraduationCap, Clock, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Milestone {
  id: string;
  icon: React.ElementType;
  label: string;
  detail?: string;
  completed: boolean;
  current?: boolean;
}

interface PupilJourneyTimelineProps {
  pupilId: string;
  brandColour?: string | null;
}

export function PupilJourneyTimeline({ pupilId, brandColour }: PupilJourneyTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const build = async () => {
      try {
        const [pupilRes, firstLessonRes, testResultRes] = await Promise.all([
          supabase
            .from("pupils")
            .select("created_at, theory_test_date, theory_test_passed, test_date")
            .eq("id", pupilId)
            .single(),
          supabase
            .from("scheduled_lessons")
            .select("lesson_date")
            .eq("pupil_id", pupilId)
            .eq("status", "completed")
            .order("lesson_date", { ascending: true })
            .limit(1),
          supabase
            .from("driving_test_results")
            .select("test_date, result")
            .eq("pupil_id", pupilId)
            .eq("is_mock", false)
            .order("test_date", { ascending: false })
            .limit(1),
        ]);

        const pupil = pupilRes.data;
        const firstLesson = firstLessonRes.data?.[0];
        const practicalResult = testResultRes.data?.[0];

        if (!pupil) return;

        const hasFirstLesson = !!firstLesson;
        const theoryPassed = pupil.theory_test_passed === true;
        const hasTheoryDate = !!pupil.theory_test_date;
        const hasTestDate = !!pupil.test_date;
        const passedPractical = practicalResult?.result === "pass";

        const items: Milestone[] = [
          {
            id: "registered",
            icon: UserPlus,
            label: "Registered",
            detail: pupil.created_at ? format(new Date(pupil.created_at), "dd MMM yyyy") : undefined,
            completed: true,
          },
          {
            id: "first-lesson",
            icon: BookOpen,
            label: "First Lesson",
            detail: hasFirstLesson
              ? format(new Date(firstLesson.lesson_date), "dd MMM yyyy")
              : "Not yet",
            completed: hasFirstLesson,
            current: !hasFirstLesson,
          },
          {
            id: "theory-test",
            icon: GraduationCap,
            label: "Theory Test",
            detail: theoryPassed
              ? "Passed ✓"
              : hasTheoryDate
                ? format(new Date(pupil.theory_test_date!), "dd MMM yyyy")
                : "Not yet",
            completed: theoryPassed,
            current: hasFirstLesson && !theoryPassed,
          },
          {
            id: "practical-booked",
            icon: Clock,
            label: "Practical Test Booked",
            detail: hasTestDate
              ? format(new Date(pupil.test_date!), "dd MMM yyyy")
              : "Not yet",
            completed: hasTestDate,
            current: theoryPassed && !hasTestDate,
          },
          {
            id: "practical-result",
            icon: Car,
            label: "Practical Test Result",
            detail: passedPractical
              ? "Passed! 🎉"
              : practicalResult
                ? "Not yet passed"
                : "Coming soon",
            completed: passedPractical,
            current: hasTestDate && !passedPractical,
          },
        ];

        setMilestones(items);
      } catch (error) {
        console.error("Error building timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    build();
  }, [pupilId]);

  const color = brandColour || "hsl(var(--primary))";

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded-2xl" />;
  }

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
