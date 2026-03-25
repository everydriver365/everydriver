import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PoundSterling } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfWeek, startOfMonth, startOfYear, format } from "date-fns";

interface AdminFeeIncomeTileProps {
  onClick?: () => void;
}

interface PeriodTotals {
  today: number;
  week: number;
  month: number;
  ytd: number;
}

export function AdminFeeIncomeTile({ onClick }: AdminFeeIncomeTileProps) {
  const { data: totals, isLoading } = useQuery<PeriodTotals>({
    queryKey: ["admin-fee-income-tile"],
    queryFn: async () => {
      const yearStart = startOfYear(new Date()).toISOString();

      const { data, error } = await supabase
        .from("platform_commissions")
        .select("commission_amount, created_at")
        .gte("created_at", yearStart);

      if (error) throw error;

      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);

      let today = 0;
      let week = 0;
      let month = 0;
      let ytd = 0;

      for (const row of data || []) {
        const amt = Number(row.commission_amount) || 0;
        const date = new Date(row.created_at);
        ytd += amt;
        if (date >= monthStart) month += amt;
        if (date >= weekStart) week += amt;
        if (row.created_at.startsWith(todayStr)) today += amt;
      }

      return { today, week, month, ytd };
    },
    staleTime: 2 * 60 * 1000,
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);

  const periods = [
    { label: "Today", value: totals?.today ?? 0 },
    { label: "This Week", value: totals?.week ?? 0 },
    { label: "This Month", value: totals?.month ?? 0 },
    { label: "Year to Date", value: totals?.ytd ?? 0 },
  ];

  return (
    <Card
      className={onClick ? "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" : ""}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PoundSterling className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Service Fee Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {periods.map((p) => (
              <div key={p.label} className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[10px] text-muted-foreground">{p.label}</p>
                <p className="text-sm font-bold text-foreground">{fmt(p.value)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
