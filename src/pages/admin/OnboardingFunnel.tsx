import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingDown } from "lucide-react";

const FUNNEL_STEPS: Array<{ event: string; label: string }> = [
  { event: "signup_started", label: "Signup started" },
  { event: "onboarding_personal_details", label: "Personal details" },
  { event: "onboarding_location", label: "Location" },
  { event: "onboarding_vehicle", label: "Vehicle" },
  { event: "onboarding_plan_selected", label: "Plan selected" },
  { event: "onboarding_payment", label: "Payment" },
  { event: "onboarding_completed", label: "Onboarding complete" },
  { event: "first_pupil_added", label: "First pupil added" },
  { event: "first_lesson_scheduled", label: "First lesson scheduled" },
  { event: "first_payment_received", label: "First payment received" },
];

interface FunnelRow {
  event: string;
  label: string;
  count: number;
  conversionPct: number;
  dropOffPct: number;
}

export default function OnboardingFunnel() {
  const [rows, setRows] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 86400000).toISOString();

      const counts = await Promise.all(
        FUNNEL_STEPS.map(async (step) => {
          const { count } = await supabase
            .from("funnel_events")
            .select("instructor_id", { count: "exact", head: true })
            .eq("event_name", step.event)
            .gte("occurred_at", since);
          return count ?? 0;
        })
      );

      const top = counts[0] || 1;
      const out: FunnelRow[] = FUNNEL_STEPS.map((step, i) => {
        const c = counts[i];
        const prev = i === 0 ? c : counts[i - 1];
        return {
          event: step.event,
          label: step.label,
          count: c,
          conversionPct: top === 0 ? 0 : (c / top) * 100,
          dropOffPct: prev === 0 ? 0 : ((prev - c) / prev) * 100,
        };
      });

      setRows(out);
      setLoading(false);
    };
    load();
  }, [days]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Onboarding Funnel</h1>
          <p className="text-sm text-muted-foreground">
            Where instructor signups drop off in the last {days} days.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stage conversion</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, i) => {
                const widthPct = Math.max(2, row.conversionPct);
                const isWorstDrop =
                  i > 0 && row.dropOffPct === Math.max(...rows.slice(1).map(r => r.dropOffPct));
                return (
                  <div key={row.event} className="flex items-center gap-3">
                    <div className="w-48 text-sm font-medium truncate">{row.label}</div>
                    <div className="flex-1 relative h-8 bg-muted rounded">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/80 rounded flex items-center px-2 text-xs text-primary-foreground"
                        style={{ width: `${widthPct}%` }}
                      >
                        {row.count}
                      </div>
                    </div>
                    <div className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                      {row.conversionPct.toFixed(1)}%
                    </div>
                    <div className="w-20 text-right text-xs tabular-nums">
                      {i === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={isWorstDrop ? "text-red-600 font-semibold" : "text-amber-600"}>
                          {isWorstDrop && <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                          -{row.dropOffPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Conversion % is relative to "Signup started". Drop-off % is relative to the previous step.
        Highest drop-off is highlighted — invest engineering effort there first.
      </p>
    </div>
  );
}
