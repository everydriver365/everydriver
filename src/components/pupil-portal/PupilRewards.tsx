import { useState, useEffect } from "react";
import { Gift, Star, Users, Copy, Check, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import RewardTiersDisplay from "./RewardTiersDisplay";

interface PupilRewardsProps {
  pupilId: string;
  brandColour?: string | null;
}

interface RewardHistory {
  id: string;
  points_change: number;
  reason: string;
  created_at: string;
}

export function PupilRewards({ pupilId, brandColour }: PupilRewardsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rewardsData, setRewardsData] = useState({
    reward_points: 0,
    total_lessons_for_rewards: 0,
    free_lessons_earned: 0,
    free_lessons_used: 0,
    referral_code: "",
  });
  const [history, setHistory] = useState<RewardHistory[]>([]);
  const [settings, setSettings] = useState({
    pointsPerLesson: 10,
    pointsForFree: 100,
    lessonsForFree: 15,
  });

  useEffect(() => {
    fetchRewardsData();
  }, [pupilId]);

  const fetchRewardsData = async () => {
    try {
      const [{ data: pupilData }, { data: historyData }, { data: settingsData }] = await Promise.all([
        supabase
          .from("pupils")
          .select("reward_points, total_lessons_for_rewards, free_lessons_earned, free_lessons_used, referral_code")
          .eq("id", pupilId)
          .single(),
        supabase
          .from("pupil_rewards_history")
          .select("id, points_change, reason, created_at")
          .eq("pupil_id", pupilId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("site_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["points_per_lesson", "points_for_free_lesson", "lessons_for_free_lesson"])
      ]);

      if (pupilData) {
        setRewardsData({
          reward_points: pupilData.reward_points || 0,
          total_lessons_for_rewards: pupilData.total_lessons_for_rewards || 0,
          free_lessons_earned: pupilData.free_lessons_earned || 0,
          free_lessons_used: pupilData.free_lessons_used || 0,
          referral_code: pupilData.referral_code || "",
        });
      }

      if (historyData) {
        setHistory(historyData);
      }

      if (settingsData) {
        const newSettings = { ...settings };
        settingsData.forEach((s: { setting_key: string; setting_value: string | null }) => {
          if (s.setting_key === "points_per_lesson" && s.setting_value) {
            newSettings.pointsPerLesson = parseInt(s.setting_value, 10);
          }
          if (s.setting_key === "points_for_free_lesson" && s.setting_value) {
            newSettings.pointsForFree = parseInt(s.setting_value, 10);
          }
          if (s.setting_key === "lessons_for_free_lesson" && s.setting_value) {
            newSettings.lessonsForFree = parseInt(s.setting_value, 10);
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(rewardsData.referral_code);
    setCopied(true);
    toast.success(t('rewards.codeCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const pointsToNextReward = settings.pointsForFree - (rewardsData.reward_points % settings.pointsForFree);
  const progressToNextReward = (rewardsData.reward_points % settings.pointsForFree);
  const lessonsToNextFree = settings.lessonsForFree - (rewardsData.total_lessons_for_rewards % settings.lessonsForFree);
  const freeLessonsAvailable = rewardsData.free_lessons_earned - rewardsData.free_lessons_used;

  const accentColor = brandColour || '#1e3a5f';

  if (loading) {
    return (
      <div className="space-y-4 px-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      {/* Points Overview */}
      <Card className="overflow-hidden">
        <div 
          className="p-4 text-white"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              <span className="font-semibold text-lg">{t('rewards.title')}</span>
            </div>
            <Sparkles className="h-5 w-5 opacity-70" />
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold mb-1">{rewardsData.reward_points}</div>
            <div className="text-sm opacity-80">{t('rewards.currentPoints')}</div>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-4">
          {/* Progress to next reward */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{t('rewards.pointsToNextReward')}</span>
              <span className="font-medium">{pointsToNextReward} points</span>
            </div>
            <Progress value={progressToNextReward} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <Gift className="h-5 w-5 mx-auto mb-1" style={{ color: accentColor }} />
              <div className="text-xl font-bold">{freeLessonsAvailable}</div>
              <div className="text-xs text-muted-foreground">{t('rewards.freeLessonsAvailable')}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xl font-bold">{rewardsData.total_lessons_for_rewards}</div>
              <div className="text-xs text-muted-foreground">{t('pupil.lessonsCompleted')}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <Users className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <div className="text-xl font-bold">{lessonsToNextFree}</div>
              <div className="text-xs text-muted-foreground">to free lesson</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Tiers & Badges */}
      <RewardTiersDisplay 
        currentPoints={rewardsData.reward_points} 
        brandColour={accentColor}
      />

      {/* Referral Code */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: accentColor }} />
            {t('rewards.shareCode')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg text-center font-bold tracking-wider">
              {rewardsData.referral_code}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={copyReferralCode}
              className="h-auto aspect-square"
            >
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t('rewards.referBonus')} - 50 points each!
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('rewards.howItWorks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: accentColor }}>
                1
              </div>
              <span>{t('rewards.earnPerLesson')} (+{settings.pointsPerLesson} points)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: accentColor }}>
                2
              </div>
              <span>Earn a free lesson at {settings.pointsForFree} points</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: accentColor }}>
                3
              </div>
              <span>Free lesson every {settings.lessonsForFree} lessons completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: accentColor }}>
                4
              </div>
              <span>{t('rewards.referBonus')} (+50 points)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('rewards.pointsHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium">{item.reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </div>
                  </div>
                  <Badge 
                    variant={item.points_change > 0 ? "default" : "secondary"}
                    className={item.points_change > 0 ? "bg-emerald-500" : ""}
                  >
                    {item.points_change > 0 ? '+' : ''}{item.points_change}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}