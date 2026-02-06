import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CheckCircle, Circle, Clock, BookOpen, GraduationCap, Car, UserPlus } from "lucide-react";

interface Milestone {
  label: string;
  date: string | null;
  status: "completed" | "pending" | "upcoming";
  detail?: string;
  icon: React.ElementType;
}

interface PupilJourneyTimelineProps {
  pupilId: string;
  pupil: {
    created_at?: string;
    instructor_id: string;
    theory_test_date: string | null;
    theory_test_passed: boolean | null;
    test_date: string | null;
  };
}

export function PupilJourneyTimeline({ pupilId, pupil }: PupilJourneyTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const build = async () => {
      try {
        // Fetch first lesson and lesson count
        const [firstLessonRes, testResultsRes] = await Promise.all([
          supabase
            .from("scheduled_lessons")
            .select("lesson_date")
            .eq("pupil_id", pupilId)
            .eq("status", "completed")
            .order("lesson_date", { ascending: true })
            .limit(1),
          supabase
            .from("driving_test_results")
            .select("test_date, result, is_mock")
            .eq("pupil_id", pupilId)
            .eq("is_mock", false)
            .order("test_date", { ascending: false })
            .limit(1),
        ]);

        const firstLesson = firstLessonRes.data?.[0];
        const practicalResult = testResultsRes.data?.[0];

        const items: Milestone[] = [
          {
            label: "Registered",
            date: pupil.created_at || null,
            status: "completed",
            icon: UserPlus,
          },
          {
            label: "First Lesson Completed",
            date: firstLesson?.lesson_date || null,
            status: firstLesson ? "completed" : "pending",
            icon: BookOpen,
          },
          {
            label: "Theory Test",
            date: pupil.theory_test_date,
            status: pupil.theory_test_passed === true
              ? "completed"
              : pupil.theory_test_date
                ? "pending"
                : "upcoming",
            detail: pupil.theory_test_passed === true
              ? "Passed"
              : pupil.theory_test_passed === false
                ? "Failed"
                : undefined,
            icon: GraduationCap,
          },
          {
            label: "Practical Test Booked",
            date: pupil.test_date,
            status: pupil.test_date ? "completed" : "upcoming",
            icon: Clock,
          },
          {
            label: "Practical Test Result",
            date: practicalResult?.test_date || null,
            status: practicalResult?.result === "pass"
              ? "completed"
              : practicalResult
                ? "pending"
                : "upcoming",
            detail: practicalResult
              ? practicalResult.result === "pass" ? "Passed! 🎉" : "Not yet passed"
              : undefined,
            icon: Car,
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
  }, [pupilId, pupil]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-muted rounded" />;
  }

  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      {milestones.map((m, i) => {
        const Icon = m.icon;
        return (
          <div key={i} className="relative flex items-start gap-3">
            <div className="absolute -left-6 flex items-center justify-center">
              {m.status === "completed" ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 bg-background rounded-full" />
              ) : m.status === "pending" ? (
                <Clock className="h-5 w-5 text-amber-500 bg-background rounded-full" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground bg-background rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className={`text-sm font-medium ${m.status === "upcoming" ? "text-muted-foreground" : ""}`}>
                  {m.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {m.date ? (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.date), "dd MMM yyyy")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Not yet</span>
                )}
                {m.detail && (
                  <span className={`text-xs font-medium ${
                    m.detail.includes("Passed") ? "text-emerald-600" : m.detail.includes("Failed") ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    · {m.detail}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
