import { BookOpen, Clock, PoundSterling } from "lucide-react";

interface EarningsSummaryStripProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
}

export function EarningsSummaryStrip({
  lessonCount,
  totalHours,
  expectedEarnings,
}: EarningsSummaryStripProps) {
  if (lessonCount === 0) return null;

  return (
    <div className="mx-4 mb-4">
      <div className="bg-card border border-border px-4 py-3 rounded-2xl">
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5 text-foreground">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">{lessonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Lessons
            </span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5 text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">{totalHours}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Hours
            </span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-foreground">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">{expectedEarnings}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Expected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
