import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays, parseISO } from "date-fns";

interface DailyEarning {
  date: string;
  amount: number;
}

interface EarningsChartProps {
  data: DailyEarning[];
  isLoading?: boolean;
}

export function EarningsChart({ data, isLoading }: EarningsChartProps) {
  const chartData = useMemo(() => {
    // Fill in missing days with 0
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
      const existing = data.find(d => d.date === date);
      return {
        date,
        amount: existing?.amount || 0,
        displayDate: format(subDays(new Date(), 13 - i), "EEE"),
      };
    });
    return last14Days;
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-32 bg-muted/30 rounded-none animate-pulse" />
    );
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="displayDate" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            interval={1}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`£${value}`, "Earnings"]}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#earningsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
