import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PoundSterling, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";

interface RevenuePerPupilChartProps {
  instructorId: string;
}

export function RevenuePerPupilChart({ instructorId }: RevenuePerPupilChartProps) {
  const [data, setData] = useState<{ name: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    try {
      const { data: payments } = await supabase
        .from("payment_history")
        .select("pupil_id, amount, pupils(name)")
        .eq("instructor_id", instructorId);

      if (!payments) { setLoading(false); return; }

      const pupilRevenue: Record<string, { name: string; revenue: number }> = {};
      for (const p of payments) {
        const id = p.pupil_id;
        const name = (p.pupils as any)?.name || "Unknown";
        if (!pupilRevenue[id]) pupilRevenue[id] = { name, revenue: 0 };
        pupilRevenue[id].revenue += Math.abs(p.amount || 0);
      }

      const sorted = Object.values(pupilRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setData(sorted);
    } catch (err) {
      console.error("Revenue per pupil error:", err);
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

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <PoundSterling className="h-4 w-4" />
            Revenue Per Pupil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payment data yet</p>
        </CardContent>
      </Card>
    );
  }

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.85)",
    "hsl(var(--primary) / 0.7)",
    "hsl(var(--primary) / 0.55)",
    "hsl(var(--primary) / 0.4)",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <PoundSterling className="h-4 w-4" />
          Revenue Per Pupil (Top 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }} className="h-[280px]">
          <BarChart data={data} layout="vertical" margin={{ left: 60, right: 20 }}>
            <XAxis type="number" tickFormatter={(v) => `£${v}`} />
            <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => `£${Number(value).toFixed(0)}`} />} />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
