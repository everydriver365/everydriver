import { useState } from "react";
import { format } from "date-fns";
import { Scale, TrendingDown, TrendingUp, Minus, Plus, Target, Ruler } from "lucide-react";
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
import { useInstructorHealth, kgToStoneLbs, stoneLbsToKg, calculateBMI, getBMICategory } from "@/hooks/useInstructorHealth";
import { cn } from "@/lib/utils";

// Height conversion helpers
function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

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
    updateSettings,
    isUpdatingSettings,
  } = useInstructorHealth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHeightDialogOpen, setIsHeightDialogOpen] = useState(false);
  const [inputUnit, setInputUnit] = useState<"kg" | "lbs" | "stone">(weightUnit || "kg");
  const [weightInput, setWeightInput] = useState("");
  const [stoneInput, setStoneInput] = useState("");
  const [lbsInput, setLbsInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [heightCmInput, setHeightCmInput] = useState("");
  const [heightFeetInput, setHeightFeetInput] = useState("");
  const [heightInchesInput, setHeightInchesInput] = useState("");
  const [heightInputUnit, setHeightInputUnit] = useState<"cm" | "ft">("cm");

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
    if (inputUnit === "stone") {
      const stone = parseFloat(stoneInput) || 0;
      const lbs = parseFloat(lbsInput) || 0;
      if (stone <= 0 && lbs <= 0) return;
      const weightKg = stoneLbsToKg(stone, lbs);
      logWeight({ weight: 0, weightKgDirect: weightKg, notes: notesInput || undefined });
    } else if (inputUnit === "lbs") {
      const lbsWeight = parseFloat(weightInput);
      if (isNaN(lbsWeight) || lbsWeight <= 0) return;
      const weightKg = lbsWeight / 2.20462;
      logWeight({ weight: 0, weightKgDirect: weightKg, notes: notesInput || undefined });
    } else {
      const kgWeight = parseFloat(weightInput);
      if (isNaN(kgWeight) || kgWeight <= 0) return;
      logWeight({ weight: 0, weightKgDirect: kgWeight, notes: notesInput || undefined });
    }
    
    setWeightInput("");
    setStoneInput("");
    setLbsInput("");
    setNotesInput("");
    setIsDialogOpen(false);
  };

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      // Reset to user's preferred unit when opening
      setInputUnit(weightUnit || "kg");
    }
  };

  const getUnitLabel = () => {
    if (weightUnit === "stone") return "stone/lbs";
    return weightUnit;
  };

  // Calculate BMI if we have height and weight
  const currentBMI = weightLogs?.length && settings?.height_cm 
    ? calculateBMI(weightLogs[weightLogs.length - 1].weight_kg, settings.height_cm)
    : null;
  
  const bmiCategory = currentBMI ? getBMICategory(currentBMI) : null;

  // Handle height save
  const handleSaveHeight = () => {
    let heightCm: number;
    if (heightInputUnit === "ft") {
      const feet = parseFloat(heightFeetInput) || 0;
      const inches = parseFloat(heightInchesInput) || 0;
      heightCm = feetInchesToCm(feet, inches);
    } else {
      heightCm = parseFloat(heightCmInput);
    }
    
    if (!isNaN(heightCm) && heightCm > 0) {
      updateSettings({ height_cm: heightCm });
      setIsHeightDialogOpen(false);
    }
  };

  // Initialize height inputs when dialog opens
  const handleHeightDialogOpen = (open: boolean) => {
    setIsHeightDialogOpen(open);
    if (open && settings?.height_cm) {
      setHeightCmInput(settings.height_cm.toString());
      const { feet, inches } = cmToFeetInches(settings.height_cm);
      setHeightFeetInput(feet.toString());
      setHeightInchesInput(inches.toString());
    }
  };

  // Format height display
  const getHeightDisplay = () => {
    if (!settings?.height_cm) return null;
    if (weightUnit === "stone") {
      const { feet, inches } = cmToFeetInches(settings.height_cm);
      return `${feet}'${inches}"`;
    }
    return `${Math.round(settings.height_cm)} cm`;
  };

  return (
    <Card className="border-rose-200/50 dark:border-rose-900/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Scale className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            Weight Tracker
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
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
                {/* Unit selector */}
                <div className="flex gap-1 p-1 bg-muted rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setInputUnit("kg")}
                    className={cn(
                      "flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors",
                      inputUnit === "kg"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputUnit("lbs")}
                    className={cn(
                      "flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors",
                      inputUnit === "lbs"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    lbs
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputUnit("stone")}
                    className={cn(
                      "flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors",
                      inputUnit === "stone"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    st/lbs
                  </button>
                </div>

                {/* Weight input based on selected unit */}
                {inputUnit === "stone" ? (
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
                    <Label htmlFor="weight">Weight ({inputUnit})</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder={inputUnit === "kg" ? "70.5" : "155.0"}
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
                  disabled={isLoggingWeight || (inputUnit === "stone" ? (!stoneInput && !lbsInput) : !weightInput)}
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
        {/* BMI Section */}
        <div className="mb-4 p-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                {currentBMI ? (
                  <>
                    <p className="text-xl font-bold">{currentBMI}</p>
                    <p className={cn("text-xs font-medium", bmiCategory?.color)}>
                      BMI · {bmiCategory?.label}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Set your height</p>
                    <p className="text-xs text-muted-foreground">to calculate BMI</p>
                  </>
                )}
              </div>
            </div>
            <Dialog open={isHeightDialogOpen} onOpenChange={handleHeightDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  {settings?.height_cm ? getHeightDisplay() : "Set Height"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Your Height</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Height unit selector */}
                  <div className="flex gap-1 p-1 bg-muted rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setHeightInputUnit("cm")}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors",
                        heightInputUnit === "cm"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightInputUnit("ft")}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-2xl transition-colors",
                        heightInputUnit === "ft"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ft/in
                    </button>
                  </div>

                  {heightInputUnit === "ft" ? (
                    <div className="space-y-2">
                      <Label>Height (feet and inches)</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            step="1"
                            min="3"
                            max="8"
                            placeholder="5"
                            value={heightFeetInput}
                            onChange={(e) => setHeightFeetInput(e.target.value)}
                            autoFocus
                          />
                          <p className="text-xs text-muted-foreground mt-1">feet</p>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="11"
                            placeholder="10"
                            value={heightInchesInput}
                            onChange={(e) => setHeightInchesInput(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">inches</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="1"
                        min="100"
                        max="250"
                        placeholder="175"
                        value={heightCmInput}
                        onChange={(e) => setHeightCmInput(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSaveHeight}
                    disabled={isUpdatingSettings || (heightInputUnit === "ft" ? (!heightFeetInput) : !heightCmInput)}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    {isUpdatingSettings ? "Saving..." : "Save Height"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
          <div className="mb-4 p-3 bg-muted/30 rounded-2xl">
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
          <div className="h-40 flex items-center justify-center bg-muted/30 rounded-2xl">
            <p className="text-sm text-muted-foreground text-center">
              Log at least 2 weights to see your trend chart
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
