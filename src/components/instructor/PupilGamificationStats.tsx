import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  Flame, 
  Trophy,
  TrendingUp,
  Star,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface PupilStats {
  drive_coins: number;
  current_streak: number;
  longest_streak: number;
  total_trips: number;
}

interface PupilGamificationStatsProps {
  pupilId: string;
  refreshTrigger?: number;
}

const PupilGamificationStats: React.FC<PupilGamificationStatsProps> = ({
  pupilId,
  refreshTrigger
}) => {
  const [stats, setStats] = useState<PupilStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('pupils')
        .select('drive_coins, current_streak, longest_streak, total_trips')
        .eq('id', pupilId)
        .single();

      if (!error && data) {
        setStats(data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [pupilId, refreshTrigger]);

  if (loading || !stats) return null;

  const getStreakMessage = (streak: number) => {
    if (streak >= 7) return '🔥 On Fire!';
    if (streak >= 5) return '⭐ Great Streak!';
    if (streak >= 3) return '👍 Keep it up!';
    if (streak >= 1) return '✨ Good start!';
    return 'Start a streak!';
  };

  const nextMilestone = Math.ceil(stats.drive_coins / 100) * 100;
  const progressToMilestone = (stats.drive_coins % 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Pupil Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {/* DriveCoins */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-3 bg-amber-500/10 rounded-none"
          >
            <Coins className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-bold text-amber-600">{stats.drive_coins || 0}</p>
            <p className="text-xs text-muted-foreground">DriveCoins</p>
          </motion.div>

          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-3 bg-orange-500/10 rounded-none"
          >
            <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-xl font-bold text-orange-600">{stats.current_streak || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </motion.div>

          {/* Total Trips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-3 bg-[#0075c9]/10 rounded-none"
          >
            <Target className="h-5 w-5 mx-auto text-[#0075c9] mb-1" />
            <p className="text-xl font-bold text-[#0075c9]">{stats.total_trips || 0}</p>
            <p className="text-xs text-muted-foreground">Lessons</p>
          </motion.div>
        </div>

        {/* Streak Status */}
        {(stats.current_streak || 0) > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-none">
            <span className="text-sm">{getStreakMessage(stats.current_streak || 0)}</span>
            <Badge variant="outline" className="text-xs">
              Best: {stats.longest_streak || 0} days
            </Badge>
          </div>
        )}

        {/* Progress to Next Milestone */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to {nextMilestone} coins</span>
            <span>{progressToMilestone}/100</span>
          </div>
          <Progress value={progressToMilestone} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PupilGamificationStats;
