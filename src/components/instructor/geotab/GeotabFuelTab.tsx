import { useState } from "react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useGeotabFuelUsage } from "@/hooks/useGeotabFuelUsage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Fuel, TrendingDown, PoundSterling, Route, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function GeotabFuelTab() {
  const { instructor } = useInstructorAuth();
  const [syncing, setSyncing] = useState(false);
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data, isLoading, refetch } = useGeotabFuelUsage(instructor?.id, fromDate);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke("geotab-behaviour-sync", {
        body: { instructorId: instructor?.id, hoursBack: 720 },
      });
      await refetch();
      toast.success("Fuel data synced");
    } catch { toast.error("Sync failed"); }
    setSyncing(false);
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>;

  const summary = data?.summary || { totalLitres: 0, totalCost: 0, averageMpg: 0, tripCount: 0 };
  const records = data?.records || [];

  // Chart data: daily totals
  const dailyMap = new Map<string, number>();
  for (const r of records) {
    if (!r.trip_start) continue;
    const day = format(new Date(r.trip_start), "MMM dd");
    dailyMap.set(day, (dailyMap.get(day) || 0) + (r.fuel_used_litres || 0));
  }
  const chartData = [...dailyMap.entries()].reverse().map(([day, litres]) => ({
    day,
    litres: Math.round(litres * 10) / 10,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Last 30 Days</h3>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} /> Sync
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Fuel, label: "Total Fuel", value: `${summary.totalLitres}L` },
          { icon: PoundSterling, label: "Total Cost", value: `£${summary.totalCost.toFixed(2)}` },
          { icon: TrendingDown, label: "Avg MPG", value: `${summary.averageMpg}` },
          { icon: Route, label: "Trips", value: `${summary.tripCount}` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Fuel Usage</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="litres" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trip list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Trip Fuel Log</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {records.length === 0 ? (
            <div className="py-8 text-center">
              <Fuel className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No fuel data yet — sync to pull from Geotab</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {records.slice(0, 50).map(r => {
                const miles = (r.distance_km || 0) * 0.621371;
                const gallons = (r.fuel_used_litres || 0) * 0.219969;
                const mpg = gallons > 0 ? Math.round((miles / gallons) * 10) / 10 : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-none hover:bg-muted/50 text-xs">
                    <div>
                      <p className="font-medium">
                        {r.trip_start ? format(new Date(r.trip_start), "dd MMM, HH:mm") : "Unknown"}
                      </p>
                      <p className="text-muted-foreground">{Math.round(miles)} mi · {r.fuel_used_litres?.toFixed(1)}L</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{mpg} mpg</p>
                      <p className="text-muted-foreground">£{r.cost_gbp?.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
