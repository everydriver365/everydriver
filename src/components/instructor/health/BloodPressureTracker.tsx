import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Heart, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface BPReading {
  id: string;
  log_date: string;
  log_time: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  notes: string | null;
}

function getBPCategory(systolic: number, diastolic: number): { label: string; color: string; bgColor: string } {
  if (systolic < 90 || diastolic < 60) {
    return { label: "Low", color: "text-sky-600", bgColor: "bg-sky-100 dark:bg-sky-900/30" };
  }
  if (systolic < 120 && diastolic < 80) {
    return { label: "Normal", color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" };
  }
  if (systolic < 130 && diastolic < 80) {
    return { label: "Elevated", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
  }
  if (systolic < 140 || diastolic < 90) {
    return { label: "High Stage 1", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" };
  }
  if (systolic < 180 && diastolic < 120) {
    return { label: "High Stage 2", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" };
  }
  return { label: "Crisis", color: "text-red-700", bgColor: "bg-red-200 dark:bg-red-900/50" };
}

export function BloodPressureTracker() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();
  const instructorId = instructor?.id;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [notes, setNotes] = useState("");

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["bp-readings", instructorId],
    queryFn: async () => {
      if (!instructorId) return [];
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("instructor_blood_pressure_logs")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("log_date", thirtyDaysAgo)
        .order("log_date", { ascending: true })
        .order("log_time", { ascending: true });
      if (error) throw error;
      return (data || []) as BPReading[];
    },
    enabled: !!instructorId,
  });

  const addReadingMutation = useMutation({
    mutationFn: async () => {
      if (!instructorId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("instructor_blood_pressure_logs")
        .insert({
          instructor_id: instructorId,
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          pulse: pulse ? parseInt(pulse) : null,
          notes: notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bp-readings", instructorId] });
      toast.success("Blood pressure logged");
      setIsDialogOpen(false);
      setSystolic("");
      setDiastolic("");
      setPulse("");
      setNotes("");
    },
    onError: () => {
      toast.error("Failed to log reading");
    },
  });

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const category = latestReading ? getBPCategory(latestReading.systolic, latestReading.diastolic) : null;

  // Calculate average
  const avgSystolic = readings.length > 0 
    ? Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length)
    : null;
  const avgDiastolic = readings.length > 0 
    ? Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length)
    : null;

  // Trend calculation
  const recentReadings = readings.slice(-7);
  const olderReadings = readings.slice(-14, -7);
  let trend: "up" | "down" | "stable" = "stable";
  if (recentReadings.length > 0 && olderReadings.length > 0) {
    const recentAvg = recentReadings.reduce((s, r) => s + r.systolic, 0) / recentReadings.length;
    const olderAvg = olderReadings.reduce((s, r) => s + r.systolic, 0) / olderReadings.length;
    if (recentAvg > olderAvg + 5) trend = "up";
    else if (recentAvg < olderAvg - 5) trend = "down";
  }

  const chartData = readings.map((r) => ({
    date: format(new Date(r.log_date), "d MMM"),
    systolic: r.systolic,
    diastolic: r.diastolic,
    pulse: r.pulse,
  }));

  return (
    <Card className="border-rose-200 dark:border-rose-800/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Blood Pressure
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
                <DialogTitle>Log Blood Pressure</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="systolic" className="text-xs">Systolic (top)</Label>
                    <Input
                      id="systolic"
                      type="number"
                      placeholder="120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="h-10 text-lg text-center"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diastolic" className="text-xs">Diastolic (bottom)</Label>
                    <Input
                      id="diastolic"
                      type="number"
                      placeholder="80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="h-10 text-lg text-center"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pulse" className="text-xs">Pulse (optional)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    placeholder="72"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g., After coffee, felt stressed"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addReadingMutation.mutate()}
                  disabled={!systolic || !diastolic || addReadingMutation.isPending}
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
                  <span className="text-3xl font-bold">{latestReading.systolic}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-2xl font-semibold">{latestReading.diastolic}</span>
                  <span className="text-xs text-muted-foreground ml-1">mmHg</span>
                </div>
                {latestReading.pulse && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    {latestReading.pulse} bpm
                  </div>
                )}
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

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-none p-2">
                <p className="text-xs text-muted-foreground">Avg Systolic</p>
                <p className="font-semibold">{avgSystolic}</p>
              </div>
              <div className="bg-muted/50 rounded-none p-2">
                <p className="text-xs text-muted-foreground">Avg Diastolic</p>
                <p className="font-semibold">{avgDiastolic}</p>
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
                    <YAxis domain={[60, 180]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="systolic" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 2 }} name="Systolic" />
                    <Line type="monotone" dataKey="diastolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} name="Diastolic" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No readings yet</p>
            <p className="text-xs text-muted-foreground">Tap "Log" to add your first reading</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
