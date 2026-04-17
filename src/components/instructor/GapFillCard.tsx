import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface GapFillCardProps {
  instructorId: string;
  instructorName: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  gapMinutes: number;
}

export function GapFillCard({
  date,
  startTime,
  endTime,
  gapMinutes,
}: GapFillCardProps) {
  const navigate = useNavigate();

  const hours = Math.floor(gapMinutes / 60);
  const mins = gapMinutes % 60;
  const gapLabel = mins > 0 ? `${hours}h ${mins}m gap` : `${hours}h gap`;

  const handleOpenFillGaps = () => {
    const search = new URLSearchParams({
      date,
      start: startTime,
      end: endTime,
      source: "schedule",
    });

    navigate(`/instructor/gaps?${search.toString()}`);
  };

  return (
    <div className="relative my-0.5 flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-foreground">{gapLabel}</div>
        <div className="text-[11px] text-muted-foreground">
          {startTime} – {endTime}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={handleOpenFillGaps}
        className="h-8 shrink-0 gap-1.5 bg-destructive px-3 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Text Pupils
      </Button>
    </div>
  );
}
