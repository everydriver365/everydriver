import { useEffect, useState } from "react";
import { Car, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface MileageTaxSavingsCardProps {
  instructorId: string;
}

export function MileageTaxSavingsCard({ instructorId }: MileageTaxSavingsCardProps) {
  const [totalMiles, setTotalMiles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const taxYearStart = new Date().getMonth() >= 3
      ? `${new Date().getFullYear()}-04-06`
      : `${new Date().getFullYear() - 1}-04-06`;

    supabase
      .from("mileage_logs")
      .select("distance_km")
      .eq("instructor_id", instructorId)
      .eq("trip_type", "business")
      .gte("log_date", taxYearStart)
      .then(({ data }) => {
        const totalKm = (data || []).reduce((s, r) => s + (r.distance_km || 0), 0);
        setTotalMiles(Math.round(totalKm * 0.621371));
        setLoading(false);
      });
  }, [instructorId]);

  // HMRC rates: 45p first 10,000 miles, 25p thereafter
  const taxDeduction = totalMiles <= 10000
    ? totalMiles * 0.45
    : 10000 * 0.45 + (totalMiles - 10000) * 0.25;

  const projectedAnnual = totalMiles > 0
    ? (taxDeduction / getMonthsElapsed()) * 12
    : 0;

  if (loading) return null;

  return (
    <Card className="border-border bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tax Savings</h3>
            <p className="text-[10px] text-muted-foreground">HMRC Mileage Allowance</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{totalMiles.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Business Miles</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">£{taxDeduction.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Tax Deduction</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <p className="text-lg font-bold text-foreground">£{projectedAnnual.toFixed(0)}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Projected/Year</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getMonthsElapsed(): number {
  const now = new Date();
  const taxYearStartMonth = 3; // April (0-indexed)
  const taxYearStartDay = 6;

  let start: Date;
  if (now.getMonth() >= taxYearStartMonth) {
    start = new Date(now.getFullYear(), taxYearStartMonth, taxYearStartDay);
  } else {
    start = new Date(now.getFullYear() - 1, taxYearStartMonth, taxYearStartDay);
  }

  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(1, months);
}
