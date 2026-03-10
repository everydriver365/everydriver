import { useState, useEffect } from "react";
import { Flame, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek } from "date-fns";
import { motion } from "framer-motion";

interface LessonStreakCardProps {
  pupilId: string;
  brandColour?: string | null;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_lessons_tracked: number;
  last_lesson_week: string | null;
}

export function LessonStreakCard({ pupilId, brandColour }: LessonStreakCardProps) {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    updateStreak();
  }, [pupilId]);

  const updateStreak = async () => {
    // Get lesson history to compute streaks by week
    const { data: lessons } = await supabase
      .from("lesson_history")
      .select("lesson_date")
      .eq("pupil_id", pupilId)
      .order("lesson_date", { ascending: true });

    if (!lessons || lessons.length === 0) return;

    // Build set of weeks with lessons
    const weeksWithLessons = new Set<string>();
    lessons.forEach((l) => {
      const weekStart = format(startOfWeek(new Date(l.lesson_date), { weekStartsOn: 1 }), "yyyy-MM-dd");
      weeksWithLessons.add(weekStart);
    });

    const sortedWeeks = Array.from(weeksWithLessons).sort();
    const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    // Count current streak backwards from current/last week
    let currentStreak = 0;
    let checkWeek = currentWeek;
    
    // Check if current or previous week had a lesson
    const prevWeek = format(startOfWeek(new Date(Date.now() - 7 * 86400000), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const startFrom = weeksWithLessons.has(currentWeek) ? currentWeek : weeksWithLessons.has(prevWeek) ? prevWeek : null;
    
    if (startFrom) {
      let weekToCheck = new Date(startFrom);
      while (weeksWithLessons.has(format(weekToCheck, "yyyy-MM-dd"))) {
        currentStreak++;
        weekToCheck = new Date(weekToCheck.getTime() - 7 * 86400000);
      }
    }

    // Find longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < sortedWeeks.length; i++) {
      const prevDate = new Date(sortedWeeks[i - 1]);
      const currDate = new Date(sortedWeeks[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000;
      if (diffDays <= 8) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    const streakData: StreakData = {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_lessons_tracked: lessons.length,
      last_lesson_week: sortedWeeks[sortedWeeks.length - 1],
    };

    setStreak(streakData);

    // Persist to DB
    const { data: existing } = await (supabase as any)
      .from("lesson_streaks")
      .select("id")
      .eq("pupil_id", pupilId)
      .maybeSingle();

    if (existing) {
      await (supabase as any).from("lesson_streaks").update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_lessons_tracked: lessons.length,
        last_lesson_week: sortedWeeks[sortedWeeks.length - 1],
        updated_at: new Date().toISOString(),
      }).eq("pupil_id", pupilId);
    } else {
      await (supabase as any).from("lesson_streaks").insert({
        pupil_id: pupilId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_lessons_tracked: lessons.length,
        last_lesson_week: sortedWeeks[sortedWeeks.length - 1],
      });
    }
  };

  if (!streak || streak.total_lessons_tracked === 0) return null;

  const flameColor = streak.current_streak >= 4
    ? "#ef4444"
    : streak.current_streak >= 2
    ? "#f59e0b"
    : "var(--brand-muted, #9ca3af)";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={streak.current_streak > 0 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className="h-5 w-5" style={{ color: flameColor }} />
        </motion.div>
        <span className="text-sm font-semibold text-foreground">Lesson Streak</span>
        {streak.current_streak >= 4 && (
          <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full font-medium ml-auto">
            🔥 On fire!
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="h-4 w-4" style={{ color: flameColor }} />
            <span className="text-xl font-bold text-foreground">{streak.current_streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Week Streak</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xl font-bold text-foreground">{streak.longest_streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Best Streak</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Zap className="h-4 w-4 text-violet-500" />
            <span className="text-xl font-bold text-foreground">{streak.total_lessons_tracked}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Total Lessons</p>
        </div>
      </div>
    </div>
  );
}
