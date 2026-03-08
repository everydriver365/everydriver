import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Trophy, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TheoryStreakTrackerProps {
  pupilId: string;
  brandColour?: string | null;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  total_xp: number;
}

export function TheoryStreakTracker({ pupilId, brandColour }: TheoryStreakTrackerProps) {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [needsPractice, setNeedsPractice] = useState(false);

  useEffect(() => {
    fetchStreak();
  }, [pupilId]);

  const fetchStreak = async () => {
    const { data } = await (supabase.from("theory_streaks") as any)
      .select("current_streak, longest_streak, last_practice_date, total_xp")
      .eq("pupil_id", pupilId)
      .maybeSingle();

    if (data) {
      setStreak(data);
      const today = format(new Date(), "yyyy-MM-dd");
      setNeedsPractice(data.last_practice_date !== today);
    }
  };

  // Award XP after a practice session
  const awardXP = async (points: number, fromMock: boolean = false) => {
    const today = format(new Date(), "yyyy-MM-dd");

    const { data: existing } = await (supabase.from("theory_streaks") as any)
      .select("*")
      .eq("pupil_id", pupilId)
      .maybeSingle();

    if (!existing) {
      // Create new streak
      await (supabase.from("theory_streaks") as any).insert({
        pupil_id: pupilId,
        current_streak: 1,
        longest_streak: 1,
        last_practice_date: today,
        total_xp: points,
      });
    } else {
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      const wasYesterday = existing.last_practice_date === yesterday;
      const isToday = existing.last_practice_date === today;

      let newStreak = existing.current_streak;
      if (!isToday) {
        newStreak = wasYesterday ? existing.current_streak + 1 : 1;
      }

      // Streak multiplier: 2x after 7 days
      const multiplier = newStreak >= 7 ? 2 : 1;
      const earnedXP = points * multiplier;

      await (supabase.from("theory_streaks") as any)
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, existing.longest_streak),
          last_practice_date: today,
          total_xp: existing.total_xp + earnedXP,
          updated_at: new Date().toISOString(),
        })
        .eq("pupil_id", pupilId);
    }

    fetchStreak();
  };

  // Expose awardXP globally for TheoryMockTest to call
  useEffect(() => {
    (window as any).__theoryStreakAwardXP = awardXP;
    return () => { delete (window as any).__theoryStreakAwardXP; };
  }, [pupilId]);

  if (!streak) return null;

  const flameColor = streak.current_streak >= 7
    ? "text-orange-500"
    : streak.current_streak >= 3
    ? "text-amber-500"
    : "text-muted-foreground";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={streak.current_streak > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flame className={`h-5 w-5 ${flameColor}`} />
          </motion.div>
          <span className="text-sm font-semibold text-foreground">Theory Streak</span>
        </div>
        {needsPractice && streak.current_streak > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full"
          >
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px] font-medium">Practice today!</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className={`h-4 w-4 ${flameColor}`} />
            <span className="text-xl font-bold text-foreground">{streak.current_streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Day Streak</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Zap className="h-4 w-4 text-violet-500" />
            <span className="text-xl font-bold text-foreground">{streak.total_xp}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Total XP</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xl font-bold text-foreground">{streak.longest_streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Best Streak</p>
        </div>
      </div>

      {/* Streak multiplier indicator */}
      {streak.current_streak >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center py-1.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10"
        >
          <span className="text-[11px] font-medium text-amber-600">
            🔥 2x XP Multiplier Active!
          </span>
        </motion.div>
      )}
    </div>
  );
}
