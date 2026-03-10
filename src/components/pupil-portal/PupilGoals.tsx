import { useState, useEffect } from "react";
import { Target, Plus, Check, Trash2, Calendar, Trophy, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PupilGoalsProps {
  pupilId: string;
  brandColour?: string | null;
  lessonsCompleted?: number | null;
  progress?: number | null;
}

interface Goal {
  id: string;
  goal_type: string;
  title: string;
  target_value: number | null;
  current_value: number | null;
  target_date: string | null;
  status: string;
}

const PRESET_GOALS = [
  { title: "Pass theory test", goal_type: "theory", target_value: 1 },
  { title: "Complete 30 hours of lessons", goal_type: "lessons", target_value: 30 },
  { title: "Pass practical test", goal_type: "practical", target_value: 1 },
  { title: "Master all manoeuvres", goal_type: "skill", target_value: 100 },
];

export function PupilGoals({ pupilId, brandColour, lessonsCompleted, progress }: PupilGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    fetchGoals();
  }, [pupilId]);

  // Auto-update goal progress based on real data
  useEffect(() => {
    if (goals.length === 0) return;
    goals.forEach(async (goal) => {
      let newValue: number | null = null;
      if (goal.goal_type === "lessons" && lessonsCompleted != null) {
        const hours = Math.round(lessonsCompleted * 1.5);
        if (hours !== (goal.current_value || 0)) newValue = hours;
      }
      if (goal.goal_type === "skill" && progress != null) {
        if (progress !== (goal.current_value || 0)) newValue = progress;
      }
      if (newValue !== null) {
        await (supabase as any).from("pupil_goals").update({ current_value: newValue, updated_at: new Date().toISOString() }).eq("id", goal.id);
        setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, current_value: newValue } : g));
      }
    });
  }, [lessonsCompleted, progress, goals.length]);

  const fetchGoals = async () => {
    const { data } = await (supabase as any)
      .from("pupil_goals")
      .select("*")
      .eq("pupil_id", pupilId)
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (data) setGoals(data);
  };

  const addGoal = async (title: string, goalType: string, targetValue: number) => {
    const { error } = await (supabase as any).from("pupil_goals").insert({
      pupil_id: pupilId,
      title,
      goal_type: goalType,
      target_value: targetValue,
      target_date: targetDate || null,
    });
    if (!error) {
      fetchGoals();
      setShowAdd(false);
      setCustomTitle("");
      setTargetDate("");
      toast.success("Goal added!");
    }
  };

  const completeGoal = async (id: string) => {
    await (supabase as any).from("pupil_goals").update({ status: "completed" }).eq("id", id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success("🎉 Goal completed!");
  };

  const removeGoal = async (id: string) => {
    await (supabase as any).from("pupil_goals").delete().eq("id", id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getProgress = (goal: Goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(100, Math.round(((goal.current_value || 0) / goal.target_value) * 100));
  };

  const primaryColor = brandColour || "hsl(var(--primary))";

  return (
    <Card style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between" style={{ color: "var(--brand-text)" }}>
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" style={{ color: primaryColor }} />
            My Goals
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GOALS.map((preset) => (
                  <button
                    key={preset.title}
                    onClick={() => addGoal(preset.title, preset.goal_type, preset.target_value)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full border border-border hover:bg-secondary/50 transition-colors"
                    style={{ color: "var(--brand-text)" }}
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Custom goal..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="h-8 text-xs w-32"
                />
              </div>
              {customTitle && (
                <Button size="sm" className="h-7 text-xs w-full" style={{ backgroundColor: primaryColor }} onClick={() => addGoal(customTitle, "custom", 1)}>
                  Add Goal
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {goals.length === 0 && !showAdd && (
          <p className="text-xs text-center py-2" style={{ color: "var(--brand-muted)" }}>
            Set goals to track your progress
          </p>
        )}

        {goals.map((goal) => {
          const pct = getProgress(goal);
          return (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-secondary/30"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--brand-text)" }}>{goal.title}</span>
                <div className="flex items-center gap-1">
                  {pct >= 100 && (
                    <button onClick={() => completeGoal(goal.id)} className="p-1 rounded-full hover:bg-secondary">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    </button>
                  )}
                  <button onClick={() => removeGoal(goal.id)} className="p-1 rounded-full hover:bg-secondary">
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="text-[10px] font-medium" style={{ color: pct >= 100 ? "#22c55e" : "var(--brand-muted)" }}>
                  {pct}%
                </span>
              </div>
              {goal.target_date && (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    By {format(new Date(goal.target_date), "d MMM yyyy")}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
