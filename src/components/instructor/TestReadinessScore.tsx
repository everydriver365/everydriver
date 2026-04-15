import { useMemo } from "react";
import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DVSA_SYLLABUS } from "@/constants/dvsaSyllabus";

interface TestReadinessScoreProps {
  pupilId: string;
  lessonsCompleted?: number;
  progress?: { competency_id: string; level: number }[];
}

export function TestReadinessScore({ pupilId, lessonsCompleted = 0, progress = [] }: TestReadinessScoreProps) {
  const { score, label, color } = useMemo(() => {
    const totalCompetencies = DVSA_SYLLABUS.length;
    const masteredCount = progress.filter(p => p.level >= 5).length;
    const syllabusPercent = totalCompetencies > 0 ? (masteredCount / totalCompetencies) * 100 : 0;

    const hoursPercent = Math.min(100, (lessonsCompleted / 45) * 100);

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

  const radius = 46;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Gradient colours based on score
  const gradientColors = score >= 80
    ? { start: "#22c55e", end: "#06b6d4" }   // green→cyan
    : score >= 60
    ? { start: "#eab308", end: "#22c55e" }   // yellow→green
    : score >= 30
    ? { start: "#f97316", end: "#eab308" }   // orange→yellow
    : { start: "#ef4444", end: "#f97316" };   // red→orange

  const glowColor = score >= 80 ? "rgba(34,197,94,0.4)" : score >= 60 ? "rgba(234,179,8,0.4)" : score >= 30 ? "rgba(249,115,22,0.4)" : "rgba(239,68,68,0.4)";

  // Tip dot position
  const tipAngle = (score / 100) * 2 * Math.PI - Math.PI / 2;
  const tipX = 60 + radius * Math.cos(tipAngle);
  const tipY = 60 + radius * Math.sin(tipAngle);

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
              <defs>
                <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gradientColors.start} />
                  <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/10" />
              <circle
                cx="60" cy="60" r={radius}
                fill="none" stroke="url(#readinessGrad)" strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${glowColor})` }}
              />
              {score > 2 && (
                <circle cx={tipX} cy={tipY} r={strokeWidth / 2 + 1} fill={gradientColors.end} opacity="0.5" style={{ filter: "blur(2px)" }} />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{score}%</span>
              <span className="text-[10px] font-medium" style={{ color: gradientColors.end }}>{label}</span>
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
