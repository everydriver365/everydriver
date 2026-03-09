import { useState, useEffect } from "react";
import { Award, Trophy, Star, Target, BookOpen, Car, Zap, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  icon_name: string | null;
  earned_at: string;
}

interface AchievementBadgesProps {
  pupilId: string;
  brandColour?: string | null;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  award: Award,
  trophy: Trophy,
  star: Star,
  target: Target,
  book: BookOpen,
  car: Car,
  zap: Zap,
  medal: Medal,
};

const typeColorMap: Record<string, string> = {
  milestone: "#f59e0b",
  skill: "#3b82f6",
  challenge: "#8b5cf6",
  streak: "#ef4444",
  default: "#10b981",
};

export function AchievementBadges({ pupilId, brandColour }: AchievementBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [pupilId]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('pupil_achievements')
        .select('id, achievement_type, achievement_name, icon_name, earned_at')
        .eq('pupil_id', pupilId)
        .order('earned_at', { ascending: false });

      if (!error && data) {
        setAchievements(data as Achievement[]);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || achievements.length === 0) return null;

  return (
    <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
          <Trophy className="h-4 w-4" style={{ color: brandColour || '#f59e0b' }} />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {achievements.map((a) => {
            const IconComp = iconMap[a.icon_name || 'award'] || Award;
            const color = typeColorMap[a.achievement_type] || typeColorMap.default;
            return (
              <div
                key={a.id}
                className="flex flex-col items-center gap-1 p-2 rounded-lg"
                style={{ backgroundColor: `${color}15` }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}25`, color }}
                >
                  <IconComp className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-center max-w-[70px] leading-tight" style={{ color: 'var(--brand-text)' }}>
                  {a.achievement_name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
