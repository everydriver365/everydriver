import { useState } from "react";
import { format } from "date-fns";
import { Scale, TrendingDown, TrendingUp, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useInstructorHealth, HealthLog } from "@/hooks/useInstructorHealth";
import { cn } from "@/lib/utils";

export function WeightTracker() {
  const {
    weightLogs,
    weightLoading,
    logWeight,
    isLoggingWeight,
    convertWeight,
    weightUnit,
    weeklyAverage,
  } = useInstructorHealth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Prepare chart data
  const chartData = (weightLogs || []).map((log) => ({
    date: format(new Date(log.log_date), "MMM d"),
    weight: convertWeight(log.weight_kg),
    fullDate: log.log_date,
  }));

  // Calculate trend
  const getTrend = () => {
    if (!weightLogs || weightLogs.length < 2) return null;
    const latest = weightLogs[weightLogs.length - 1].weight_kg;
    const previous = weightLogs[weightLogs.length - 2].weight_kg;
    const diff = latest - previous;
    return {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      value: Math.abs(convertWeight(diff)),
    };
  };

  const trend = getTrend();
  const latestWeight = weightLogs?.length
    ? convertWeight(weightLogs[weightLogs.length - 1].weight_kg)
    : null;

  const handleLogWeight = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    logWeight({ weight, notes: notesInput || undefined });
    setWeightInput("");
    setNotesInput("");
    setIsDialogOpen(false);
  };

  return (
    <Card className="border-rose-200/50 dark:border-rose-900/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Scale className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            Weight Tracker
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700">
                <Plus className="h-4 w-4 mr-1" />
                Log
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Your Weight</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight ({weightUnit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder={weightUnit === "kg" ? "70.5" : "155.0"}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="How are you feeling today?"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleLogWeight}
                  disabled={isLoggingWeight || !weightInput}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  {isLoggingWeight ? "Saving..." : "Save Weight"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold">
              {latestWeight !== null ? (
                <>
                  {latestWeight}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {weightUnit}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground text-base">No data yet</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                trend.direction === "down"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : trend.direction === "up"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
              )}
            >
              {trend.direction === "down" ? (
                <TrendingDown className="h-3 w-3" />
              ) : trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {trend.value.toFixed(1)} {weightUnit}
            </div>
          )}

          {weeklyAverage !== null && (
            <div className="text-right">
              <p className="text-lg font-semibold">{weeklyAverage.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">7-day avg</p>
            </div>
          )}
        </div>

        {/* Chart */}
        {chartData.length > 1 ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(346 77% 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(346 77% 50%)", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "hsl(346 77% 50%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Log at least 2 weights to see your trend chart
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
