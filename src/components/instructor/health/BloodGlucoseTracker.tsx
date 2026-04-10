import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Droplet, AlertTriangle, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GlucoseReading {
  id: string;
  log_date: string;
  log_time: string;
  reading_mmol: number;
  reading_type: string;
  notes: string | null;
}

const READING_TYPES = [
  { value: "fasting", label: "Fasting" },
  { value: "before_meal", label: "Before Meal" },
  { value: "after_meal", label: "After Meal (2hr)" },
  { value: "bedtime", label: "Bedtime" },
  { value: "random", label: "Random" },
];

function getGlucoseCategory(reading: number, type: string): { label: string; color: string; bgColor: string } {
  // Normal ranges vary by reading type
  if (type === "fasting" || type === "before_meal") {
    if (reading < 4.0) return { label: "Low", color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30" };
    if (reading <= 5.9) return { label: "Normal", color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" };
    if (reading <= 6.9) return { label: "Pre-diabetic", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
    return { label: "High", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" };
  } else {
    // After meal / random
    if (reading < 4.0) return { label: "Low", color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30" };
    if (reading <= 7.8) return { label: "Normal", color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" };
    if (reading <= 11.0) return { label: "Elevated", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
    return { label: "High", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" };
  }
}

// Estimate A1C from average glucose (ADAG formula)
function estimateA1C(avgGlucose: number): number {
  // A1C = (average glucose in mmol/L + 2.59) / 1.59
  return Math.round(((avgGlucose + 2.59) / 1.59) * 10) / 10;
}

function getA1CCategory(a1c: number): { label: string; color: string } {
  if (a1c < 5.7) return { label: "Normal", color: "text-emerald-600" };
  if (a1c < 6.5) return { label: "Pre-diabetic", color: "text-amber-600" };
  return { label: "Diabetic Range", color: "text-red-600" };
}

export function BloodGlucoseTracker() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const instructorId = instructor?.id;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reading, setReading] = useState("");
  const [readingType, setReadingType] = useState("fasting");
  const [notes, setNotes] = useState("");

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["glucose-readings", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("instructor_blood_glucose_logs")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("log_date", ninetyDaysAgo)
        .order("log_date", { ascending: true })
        .order("log_time", { ascending: true });
      if (error) throw error;
      return (data || []) as GlucoseReading[];
    },
    enabled: !!instructorId,
  });

  const addReadingMutation = useMutation({
    mutationFn: async () => {
      if (!instructorId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("instructor_blood_glucose_logs")
        .insert({
          instructor_id: instructorId,
          reading_mmol: parseFloat(reading),
          reading_type: readingType,
          notes: notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucose-readings", instructorId] });
      toast.success("Glucose reading logged");
      setIsDialogOpen(false);
      setReading("");
      setReadingType("fasting");
      setNotes("");
    },
    onError: () => {
      toast.error("Failed to log reading");
    },
  });

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const category = latestReading ? getGlucoseCategory(latestReading.reading_mmol, latestReading.reading_type) : null;

  // Calculate average and estimated A1C (last 90 days)
  const avgGlucose = readings.length > 0 
    ? Math.round(readings.reduce((sum, r) => sum + r.reading_mmol, 0) / readings.length * 10) / 10
    : null;
  const estimatedA1c = avgGlucose ? estimateA1C(avgGlucose) : null;
  const a1cCategory = estimatedA1c ? getA1CCategory(estimatedA1c) : null;

  // Trend calculation
  const recentReadings = readings.slice(-14);
  const olderReadings = readings.slice(-28, -14);
  let trend: "up" | "down" | "stable" = "stable";
  if (recentReadings.length > 0 && olderReadings.length > 0) {
    const recentAvg = recentReadings.reduce((s, r) => s + r.reading_mmol, 0) / recentReadings.length;
    const olderAvg = olderReadings.reduce((s, r) => s + r.reading_mmol, 0) / olderReadings.length;
    if (recentAvg > olderAvg + 0.5) trend = "up";
    else if (recentAvg < olderAvg - 0.5) trend = "down";
  }

  const chartData = readings.slice(-30).map((r) => ({
    date: format(new Date(r.log_date), "d MMM"),
    glucose: r.reading_mmol,
    type: READING_TYPES.find(t => t.value === r.reading_type)?.label || r.reading_type,
  }));

  return (
    <Card className="border-purple-200 dark:border-purple-800/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplet className="h-4 w-4 text-purple-500" />
            Blood Glucose
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Log</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Log Blood Glucose</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="reading" className="text-xs">Reading (mmol/L)</Label>
                  <Input
                    id="reading"
                    type="number"
                    step="0.1"
                    placeholder="5.5"
                    value={reading}
                    onChange={(e) => setReading(e.target.value)}
                    className="h-12 text-2xl text-center"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-xs">Reading Type</Label>
                  <Select value={readingType} onValueChange={setReadingType}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {READING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g., After exercise, felt unwell"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addReadingMutation.mutate()}
                  disabled={!reading || addReadingMutation.isPending}
                >
                  {addReadingMutation.isPending ? "Saving..." : "Save Reading"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
        ) : latestReading ? (
          <>
            {/* Current Reading */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{latestReading.reading_mmol}</span>
                  <span className="text-sm text-muted-foreground">mmol/L</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {READING_TYPES.find(t => t.value === latestReading.reading_type)?.label}
                </p>
              </div>
              <div className="text-right">
                <span className={cn("text-sm font-medium px-2 py-1 rounded", category?.bgColor, category?.color)}>
                  {category?.label}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(latestReading.log_date), "d MMM")}
                </p>
              </div>
            </div>

            {/* Estimated A1C Card */}
            {estimatedA1c && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-none p-3 border border-purple-200 dark:border-purple-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Estimated HbA1c</span>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Estimated from your 90-day average glucose using the ADAG formula. For accurate A1C, consult your doctor for a blood test.</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-xl font-bold", a1cCategory?.color)}>{estimatedA1c}%</span>
                    <p className={cn("text-xs", a1cCategory?.color)}>{a1cCategory?.label}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-none p-2">
                <p className="text-xs text-muted-foreground">90-day Avg</p>
                <p className="font-semibold">{avgGlucose}</p>
              </div>
              <div className="bg-muted/50 rounded-none p-2">
                <p className="text-xs text-muted-foreground">Readings</p>
                <p className="font-semibold">{readings.length}</p>
              </div>
              <div className="bg-muted/50 rounded-none p-2">
                <p className="text-xs text-muted-foreground">Trend</p>
                <div className="flex items-center justify-center gap-1">
                  {trend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
                  {trend === "down" && <TrendingDown className="h-4 w-4 text-emerald-500" />}
                  {trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="h-40 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[2, 15]} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ fontSize: 12 }} 
                      formatter={(value: number, name: string) => [`${value} mmol/L`, "Glucose"]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return `${label} (${item?.type || ''})`;
                      }}
                    />
                    <ReferenceLine y={4} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: "Low", fontSize: 9 }} />
                    <ReferenceLine y={7} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "High", fontSize: 9 }} />
                    <Line type="monotone" dataKey="glucose" stroke="hsl(270, 70%, 50%)" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Warning if high */}
            {latestReading.reading_mmol > 10 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span>High reading detected. Consider consulting your GP if readings remain elevated.</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Droplet className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No readings yet</p>
            <p className="text-xs text-muted-foreground">Tap "Log" to add your first reading</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
