import { useEffect, useState, useMemo } from "react";
import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DVSA_SYLLABUS } from "@/constants/dvsaSyllabus";

interface TestReadinessScoreProps {
  pupilId: string;
}

export function TestReadinessScore({ pupilId }: TestReadinessScoreProps) {
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [progress, setProgress] = useState<{ competency_id: string; level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("pupils").select("lessons_completed").eq("id", pupilId).single(),
      supabase.from("pupil_competency_progress").select("competency_id, level").eq("pupil_id", pupilId),
    ]).then(([pupilRes, progressRes]) => {
      setLessonsCompleted(pupilRes.data?.lessons_completed || 0);
      setProgress((progressRes.data || []) as { competency_id: string; level: number }[]);
      setLoading(false);
    });
  }, [pupilId]);

  const { score, label, color } = useMemo(() => {
    const totalCompetencies = DVSA_SYLLABUS.length;
    const masteredCount = progress.filter(p => p.level >= 5).length;
    const syllabusPercent = totalCompetencies > 0 ? (masteredCount / totalCompetencies) * 100 : 0;

    // Hours weight (target ~45 hours typical)
    const hoursPercent = Math.min(100, (lessonsCompleted / 45) * 100);

    // Average level
    const avgLevel = progress.length > 0
      ? progress.reduce((s, p) => s + p.level, 0) / progress.length
      : 0;
    const levelPercent = (avgLevel / 5) * 100;

    const readiness = Math.round(syllabusPercent * 0.4 + hoursPercent * 0.3 + levelPercent * 0.3);

    let lbl = "Getting Started";
    let clr = "hsl(var(--destructive))";
    if (readiness >= 80) { lbl = "Test Ready!"; clr = "hsl(142, 70%, 45%)"; }
    else if (readiness >= 60) { lbl = "Nearly There"; clr = "hsl(45, 90%, 50%)"; }
    else if (readiness >= 30) { lbl = "Building Skills"; clr = "hsl(30, 80%, 55%)"; }

    return { score: readiness, label: lbl, color: clr };
  }, [progress, lessonsCompleted]);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (loading) return null;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Test Readiness</h3>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
              <circle
                cx="60" cy="60" r={radius}
                fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{score}%</span>
              <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-center text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">{lessonsCompleted}</span> lessons
          </div>
          <div>
            <span className="font-semibold text-foreground">{progress.filter(p => p.level >= 5).length}</span>/{DVSA_SYLLABUS.length} mastered
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
