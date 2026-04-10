import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BusiestHoursHeatmapProps {
  instructorId: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

export function BusiestHoursHeatmap({ instructorId }: BusiestHoursHeatmapProps) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [maxCount, setMaxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", threeMonthsAgo.toISOString().split("T")[0])
        .in("status", ["scheduled", "completed"]);

      const heatGrid: number[][] = Array.from({ length: 7 }, () => Array(13).fill(0));
      let max = 0;

      for (const lesson of lessons || []) {
        if (!lesson.start_time) continue;
        const date = new Date(lesson.lesson_date + "T00:00:00");
        const dayIdx = (date.getDay() + 6) % 7; // Mon=0
        const hour = parseInt(lesson.start_time.split(":")[0], 10);
        const hourIdx = hour - 7;
        if (hourIdx >= 0 && hourIdx < 13) {
          heatGrid[dayIdx][hourIdx]++;
          if (heatGrid[dayIdx][hourIdx] > max) max = heatGrid[dayIdx][hourIdx];
        }
      }

      setGrid(heatGrid);
      setMaxCount(max);
    } catch (err) {
      console.error("Heatmap error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/30";
    const intensity = count / Math.max(maxCount, 1);
    if (intensity > 0.75) return "bg-primary";
    if (intensity > 0.5) return "bg-primary/70";
    if (intensity > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Busiest Hours (Last 3 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header */}
            <div className="flex gap-0.5 mb-1">
              <div className="w-8" />
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                  {h > 12 ? `${h - 12}p` : `${h}a`}
                </div>
              ))}
            </div>
            {/* Grid */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex gap-0.5 mb-0.5">
                <div className="w-8 text-[10px] text-muted-foreground flex items-center">{day}</div>
                {HOURS.map((_, hourIdx) => {
                  const count = grid[dayIdx]?.[hourIdx] || 0;
                  return (
                    <div
                      key={hourIdx}
                      className={`flex-1 aspect-square rounded-none ${getColor(count)} transition-colors`}
                      title={`${day} ${HOURS[hourIdx]}:00 — ${count} lessons`}
                    />
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-muted-foreground">Less</span>
              <div className="w-3 h-3 rounded-none bg-muted/30" />
              <div className="w-3 h-3 rounded-none bg-primary/20" />
              <div className="w-3 h-3 rounded-none bg-primary/40" />
              <div className="w-3 h-3 rounded-none bg-primary/70" />
              <div className="w-3 h-3 rounded-none bg-primary" />
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
