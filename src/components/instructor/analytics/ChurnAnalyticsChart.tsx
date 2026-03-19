import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserMinus, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface ChurnAnalyticsChartProps {
  instructorId: string;
}

export function ChurnAnalyticsChart({ instructorId }: ChurnAnalyticsChartProps) {
  const [data, setData] = useState<{ month: string; churned: number; reEngaged: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    try {
      const { data: events } = await supabase
        .from("churn_events")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("detected_at", { ascending: true });

      // Build monthly data for last 6 months
      const months: { month: string; churned: number; reEngaged: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        const label = format(monthDate, "MMM");

        const churned = (events || []).filter(
          (e) => new Date(e.detected_at) >= start && new Date(e.detected_at) <= end
        ).length;
        const reEngaged = (events || []).filter(
          (e) => e.re_engaged_at && new Date(e.re_engaged_at) >= start && new Date(e.re_engaged_at) <= end
        ).length;

        months.push({ month: label, churned, reEngaged });
      }

      setData(months);
    } catch (err) {
      console.error("Churn analytics error:", err);
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

  const totalChurned = data.reduce((s, d) => s + d.churned, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <UserMinus className="h-4 w-4" />
          Churn Over Time
          {totalChurned > 0 && (
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              {totalChurned} total in 6 months
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalChurned === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No churn events recorded yet. Churn is automatically detected from retention alerts.</p>
        ) : (
          <ChartContainer
            config={{
              churned: { label: "Churned", color: "hsl(var(--destructive))" },
              reEngaged: { label: "Re-engaged", color: "hsl(var(--primary))" },
            }}
            className="h-[200px]"
          >
            <AreaChart data={data}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="churned" fill="hsl(var(--destructive) / 0.2)" stroke="hsl(var(--destructive))" strokeWidth={2} />
              <Area type="monotone" dataKey="reEngaged" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
