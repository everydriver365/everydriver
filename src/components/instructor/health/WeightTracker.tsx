import { useState } from "react";
import { format } from "date-fns";
import { Scale, TrendingDown, TrendingUp, Minus, Plus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { useInstructorHealth, kgToStoneLbs, stoneLbsToKg } from "@/hooks/useInstructorHealth";
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
    settings,
  } = useInstructorHealth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [stoneInput, setStoneInput] = useState("");
  const [lbsInput, setLbsInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Prepare chart data
  const chartData = (weightLogs || []).map((log) => {
    if (weightUnit === "stone") {
      // For stone display, convert to decimal stone for charting
      const totalLbs = log.weight_kg * 2.20462;
      const decimalStone = totalLbs / 14;
      return {
        date: format(new Date(log.log_date), "MMM d"),
        weight: Math.round(decimalStone * 100) / 100,
        fullDate: log.log_date,
        displayWeight: formatStoneDisplay(log.weight_kg),
      };
    }
    return {
      date: format(new Date(log.log_date), "MMM d"),
      weight: convertWeight(log.weight_kg),
      fullDate: log.log_date,
      displayWeight: `${convertWeight(log.weight_kg)} ${weightUnit}`,
    };
  });

  // Format stone display (e.g., "12st 7lbs")
  function formatStoneDisplay(weightKg: number): string {
    const { stone, lbs } = kgToStoneLbs(weightKg);
    return `${stone}st ${lbs}lbs`;
  }

  // Calculate trend
  const getTrend = () => {
    if (!weightLogs || weightLogs.length < 2) return null;
    const latest = weightLogs[weightLogs.length - 1].weight_kg;
    const previous = weightLogs[weightLogs.length - 2].weight_kg;
    const diff = latest - previous;
    
    if (weightUnit === "stone") {
      const diffLbs = Math.abs(diff * 2.20462);
      return {
        direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
        value: Math.round(diffLbs * 10) / 10,
        display: `${Math.round(diffLbs * 10) / 10} lbs`,
      };
    }
    
    return {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      value: Math.abs(convertWeight(diff)),
      display: `${Math.abs(convertWeight(diff)).toFixed(1)} ${weightUnit}`,
    };
  };

  const trend = getTrend();
  
  // Get latest weight display
  const getLatestWeightDisplay = () => {
    if (!weightLogs?.length) return null;
    const latestKg = weightLogs[weightLogs.length - 1].weight_kg;
    
    if (weightUnit === "stone") {
      return formatStoneDisplay(latestKg);
    }
    return `${convertWeight(latestKg)} ${weightUnit}`;
  };

  const latestWeightDisplay = getLatestWeightDisplay();

  // Calculate progress towards goal (if set)
  const getProgress = () => {
    if (!weightLogs || weightLogs.length < 2) return null;
    const startWeight = weightLogs[0].weight_kg;
    const currentWeight = weightLogs[weightLogs.length - 1].weight_kg;
    const change = startWeight - currentWeight;
    const percentChange = Math.abs((change / startWeight) * 100);
    return {
      startWeight,
      currentWeight,
      change,
      percentChange: Math.round(percentChange * 10) / 10,
      isLoss: change > 0,
    };
  };

  const progress = getProgress();

  const handleLogWeight = () => {
    if (weightUnit === "stone") {
      const stone = parseFloat(stoneInput) || 0;
      const lbs = parseFloat(lbsInput) || 0;
      if (stone <= 0 && lbs <= 0) return;
      const weightKg = stoneLbsToKg(stone, lbs);
      // Pass the kg value directly using weightKgDirect
      logWeight({ weight: 0, weightKgDirect: weightKg, notes: notesInput || undefined });
    } else if (weightUnit === "lbs") {
      const lbsWeight = parseFloat(weightInput);
      if (isNaN(lbsWeight) || lbsWeight <= 0) return;
      logWeight({ weight: lbsWeight, notes: notesInput || undefined });
    } else {
      const kgWeight = parseFloat(weightInput);
      if (isNaN(kgWeight) || kgWeight <= 0) return;
      logWeight({ weight: kgWeight, notes: notesInput || undefined });
    }
    
    setWeightInput("");
    setStoneInput("");
    setLbsInput("");
    setNotesInput("");
    setIsDialogOpen(false);
  };

  const getUnitLabel = () => {
    if (weightUnit === "stone") return "stone/lbs";
    return weightUnit;
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
                {weightUnit === "stone" ? (
                  <div className="space-y-2">
                    <Label>Weight (stones and pounds)</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="12"
                          value={stoneInput}
                          onChange={(e) => setStoneInput(e.target.value)}
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground mt-1">stone</p>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="13.9"
                          placeholder="7"
                          value={lbsInput}
                          onChange={(e) => setLbsInput(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">lbs</p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
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
                  disabled={isLoggingWeight || (weightUnit === "stone" ? (!stoneInput && !lbsInput) : !weightInput)}
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
              {latestWeightDisplay !== null ? (
                latestWeightDisplay
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
              {trend.display}
            </div>
          )}

          {weeklyAverage !== null && (
            <div className="text-right">
              <p className="text-lg font-semibold">
                {weightUnit === "stone" 
                  ? formatStoneDisplay(weeklyAverage / 2.20462 * 14) // Convert back properly
                  : weeklyAverage.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">7-day avg</p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {progress && weightLogs && weightLogs.length >= 3 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-medium">30-Day Progress</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started: {weightUnit === "stone" ? formatStoneDisplay(progress.startWeight) : `${convertWeight(progress.startWeight)} ${weightUnit}`}</span>
                <span>Now: {weightUnit === "stone" ? formatStoneDisplay(progress.currentWeight) : `${convertWeight(progress.currentWeight)} ${weightUnit}`}</span>
              </div>
              <Progress 
                value={Math.min(progress.percentChange * 10, 100)} 
                className="h-2"
              />
              <p className="text-xs text-center">
                {progress.isLoss ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ↓ {progress.percentChange}% ({weightUnit === "stone" 
                      ? `${Math.round(progress.change * 2.20462 * 10) / 10} lbs` 
                      : `${convertWeight(progress.change).toFixed(1)} ${weightUnit}`} lost)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    ↑ {progress.percentChange}% ({weightUnit === "stone" 
                      ? `${Math.round(Math.abs(progress.change) * 2.20462 * 10) / 10} lbs` 
                      : `${Math.abs(convertWeight(progress.change)).toFixed(1)} ${weightUnit}`} gained)
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

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
                  tickFormatter={(value) => weightUnit === "stone" ? value.toFixed(1) : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string, props: any) => [
                    props.payload.displayWeight || `${value} ${weightUnit}`,
                    "Weight"
                  ]}
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
