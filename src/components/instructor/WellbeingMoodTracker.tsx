import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Smile, Meh, Frown, Zap, Brain, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

const MOODS = [
  { score: 1, icon: Frown, label: "Struggling", color: "text-red-500" },
  { score: 2, icon: Frown, label: "Low", color: "text-orange-500" },
  { score: 3, icon: Meh, label: "Okay", color: "text-yellow-500" },
  { score: 4, icon: Smile, label: "Good", color: "text-lime-500" },
  { score: 5, icon: Smile, label: "Great", color: "text-green-500" },
];

export function WellbeingMoodTracker({ instructorId }: { instructorId: string }) {
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [notes, setNotes] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayEntry } = useQuery({
    queryKey: ["mood-today", instructorId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("logged_date", today)
        .maybeSingle();
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["mood-history", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("logged_date", format(subDays(new Date(), 14), "yyyy-MM-dd"))
        .order("logged_date", { ascending: false });
      return data || [];
    },
  });

  const logMutation = useMutation({
    mutationFn: async () => {
      if (selectedMood === null) return;
      const { error } = await supabase.from("mood_entries").upsert({
        instructor_id: instructorId,
        mood_score: selectedMood,
        energy_level: energy,
        stress_level: stress,
        notes: notes || null,
        logged_date: today,
      }, { onConflict: "instructor_id,logged_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-today"] });
      queryClient.invalidateQueries({ queryKey: ["mood-history"] });
      toast.success("Mood logged for today");
    },
  });

  const avgMood = history.length ? (history.reduce((s: number, e: any) => s + e.mood_score, 0) / history.length).toFixed(1) : "–";
  const avgEnergy = history.length ? (history.reduce((s: number, e: any) => s + (e.energy_level || 3), 0) / history.length).toFixed(1) : "–";

  if (todayEntry) {
    const moodInfo = MOODS.find((m) => m.score === todayEntry.mood_score) || MOODS[2];
    const MoodIcon = moodInfo.icon;
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Wellbeing Tracker
        </h2>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-center space-y-2">
            <MoodIcon className={`h-10 w-10 mx-auto ${moodInfo.color}`} />
            <p className="font-semibold">Today: {moodInfo.label}</p>
            <p className="text-xs text-muted-foreground">Logged at {format(new Date(todayEntry.created_at), "HH:mm")}</p>
          </CardContent>
        </Card>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{avgMood}</p>
              <p className="text-xs text-muted-foreground">Avg Mood (14d)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-xl font-bold">{avgEnergy}</p>
              <p className="text-xs text-muted-foreground">Avg Energy</p>
            </CardContent>
          </Card>
        </div>
        {/* Mini history */}
        <div className="flex gap-1 justify-center">
          {history.slice(0, 14).reverse().map((entry: any) => {
            const m = MOODS.find((x) => x.score === entry.mood_score) || MOODS[2];
            return (
              <div key={entry.id} className="flex flex-col items-center" title={`${format(new Date(entry.logged_date), "dd MMM")}: ${m.label}`}>
                <div className={`h-6 w-2 rounded-full ${entry.mood_score >= 4 ? "bg-green-400" : entry.mood_score === 3 ? "bg-yellow-400" : "bg-red-400"}`} style={{ opacity: 0.3 + entry.mood_score * 0.14 }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary" />
        How are you feeling today?
      </h2>
      <div className="flex justify-center gap-3">
        {MOODS.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.score} onClick={() => setSelectedMood(m.score)} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${selectedMood === m.score ? "bg-primary/10 scale-110 ring-2 ring-primary" : "hover:bg-secondary"}`}>
              <Icon className={`h-8 w-8 ${m.color}`} />
              <span className="text-xs">{m.label}</span>
            </button>
          );
        })}
      </div>

      {selectedMood !== null && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-1"><Zap className="h-3.5 w-3.5" />Energy Level</label>
            <input type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(+e.target.value)} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Exhausted</span><span>Energised</span></div>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-1"><Brain className="h-3.5 w-3.5" />Stress Level</label>
            <input type="range" min={1} max={5} value={stress} onChange={(e) => setStress(+e.target.value)} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>Calm</span><span>Very stressed</span></div>
          </div>
          <Input placeholder="Any notes? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="w-full" onClick={() => logMutation.mutate()}>Log Today's Mood</Button>
        </div>
      )}
    </div>
  );
}
